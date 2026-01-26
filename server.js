import express from "express";
import pkg from "pg";
import cors from "cors";
import "dotenv/config";
import session from "express-session";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";
import connectPgSimple from "connect-pg-simple";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pkg;
const PgSession = connectPgSimple(session);
const app = express();

app.set("trust proxy", 1); // Confia no proxy (Vercel/Nginx) para HTTPS e Host corretos

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// Configuração da ligação ao PostgreSQL
const useSSL = process.env.DB_SSL === "true" || (process.env.NODE_ENV === "production" && process.env.DB_SSL !== "false");

let connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  if (!process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_HOST || !process.env.DB_NAME) {
    console.error("ERRO CRÍTICO: Variáveis de conexão com banco de dados faltando. Verifique DB_USER, DB_PASSWORD, DB_HOST, DB_NAME.");
  }
  
  const user = encodeURIComponent(process.env.DB_USER);
  const password = encodeURIComponent(process.env.DB_PASSWORD);
  const host = process.env.DB_HOST;
  const port = process.env.DB_PORT || 5432;
  const dbName = encodeURIComponent(process.env.DB_NAME);
  
  connectionString = `postgres://${user}:${password}@${host}:${port}/${dbName}${useSSL ? "?sslmode=require" : ""}`;
} else {
    // Se usar DATABASE_URL e precisar de SSL, anexa o parametro se nao existir
    if (useSSL && !connectionString.includes("sslmode=")) {
        connectionString += connectionString.includes("?") ? "&sslmode=require" : "?sslmode=require";
    }
}

const pool = new Pool({
  connectionString,
  ssl: useSSL ? { rejectUnauthorized: false } : undefined,
});

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  }),
);
app.use(express.json());
app.use(
  session({
    store: new PgSession({
      pool: pool,
      tableName: "session",
      createTableIfMissing: true
    }),
    secret: process.env.SESSION_SECRET || "dev_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production", 
      sameSite: "lax", // 'lax' é seguro o suficiente e funciona bem para auth em localhost e produção na maioria dos casos. 'none' exige secure: true.
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  }),
);
app.use(passport.initialize());
app.use(passport.session());

// Debug Middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - Session ID: ${req.sessionID} - User: ${req.user ? req.user.id : "Unauthenticated"}`);
  next();
});

// Inicialização das tabelas e migrações
const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE,
        password VARCHAR(255),
        google_id VARCHAR(255),
        github_id VARCHAR(255),
        theme VARCHAR(20) DEFAULT 'light'
      );

      CREATE TABLE IF NOT EXISTS links (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        title VARCHAR(255) NOT NULL,
        url TEXT NOT NULL,
        order_index INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS tags (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        name VARCHAR(50) NOT NULL,
        color VARCHAR(20) DEFAULT '#3b82f6'
      );

      CREATE TABLE IF NOT EXISTS tabs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        name VARCHAR(50) NOT NULL,
        order_index INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS link_tags (
        link_id INTEGER REFERENCES links(id) ON DELETE CASCADE,
        tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
        PRIMARY KEY (link_id, tag_id)
      );
      
      CREATE TABLE IF NOT EXISTS "session" (
        "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL
      )
      WITH (OIDS=FALSE);

      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'session_pkey') THEN
          ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;
        END IF;
      END $$;

      CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
    `);

    // Migrações para garantir colunas novas em bancos existentes
    await pool.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='theme') THEN
          ALTER TABLE users ADD COLUMN theme VARCHAR(20) DEFAULT 'light';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='google_id') THEN
          ALTER TABLE users ADD COLUMN google_id VARCHAR(255);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='github_id') THEN
          ALTER TABLE users ADD COLUMN github_id VARCHAR(255);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='name') THEN
          ALTER TABLE users ADD COLUMN name VARCHAR(255);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='avatar_url') THEN
          ALTER TABLE users ADD COLUMN avatar_url TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='view_mode') THEN
          ALTER TABLE users ADD COLUMN view_mode VARCHAR(20) DEFAULT 'categorized';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tags' AND column_name='order_index') THEN
          ALTER TABLE tags ADD COLUMN order_index INTEGER DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tags' AND column_name='tab_id') THEN
          ALTER TABLE tags ADD COLUMN tab_id INTEGER REFERENCES tabs(id) ON DELETE SET NULL;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='link_tags' AND column_name='order_index') THEN
          ALTER TABLE link_tags ADD COLUMN order_index INTEGER DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='links' AND column_name='icon_url') THEN
          ALTER TABLE links ADD COLUMN icon_url TEXT;
        END IF;
        ALTER TABLE users ALTER COLUMN password DROP NOT NULL;
        ALTER TABLE users ALTER COLUMN email DROP NOT NULL; 
      END $$;
    `);

    console.log("Banco de dados PostgreSQL pronto e atualizado.");
  } catch (err) {
    console.error("Erro ao inicializar banco de dados:", err);
  }
};
// Executa initDB apenas se não estiver em ambiente serverless (para evitar overhead em cada request) ou se for o primeiro boot
// No Vercel, serverless functions podem não esperar promises async soltas.
// Idealmente, initDB deve ser rodado manualmente ou checado. 
// Vamos manter assim, mas em serverless isso pode ser um gargalo.
initDB();

// --- PASSPORT CONFIG ---

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    if (result.rows.length > 0) {
      done(null, result.rows[0]);
    } else {
      done(new Error("User not found"), null);
    }
  } catch (err) {
    done(err, null);
  }
});

// Google Strategy
const googleConfigured = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;
if (googleConfigured) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/auth/google/callback",
        userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
        proxy: true
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const name = profile.displayName;
          const avatar_url = profile.photos && profile.photos[0] ? profile.photos[0].value : null;
          const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;

          // Verifica se usuario ja existe pelo google_id
          let result = await pool.query(
            "SELECT * FROM users WHERE google_id = $1",
            [profile.id],
          );
          
          if (result.rows.length > 0) {
            // Atualiza informações (nome, avatar, email se mudou)
            const updatedUser = await pool.query(
              "UPDATE users SET name = $1, avatar_url = $2, email = COALESCE($3, email) WHERE id = $4 RETURNING *",
              [name, avatar_url, email, result.rows[0].id]
            );
            return done(null, updatedUser.rows[0]);
          }

          // Se nao, verifica por email (se disponivel) para linkar contas (opcional, aqui simplificado cria novo)
          // Vamos criar um novo
          result = await pool.query(
            "INSERT INTO users (google_id, email, name, avatar_url, theme) VALUES ($1, $2, $3, $4, $5) RETURNING *",
            [profile.id, email, name, avatar_url, "light"],
          );
          done(null, result.rows[0]);
        } catch (err) {
          done(err, null);
        }
      },
    ),
  );
}

// GitHub Strategy
const githubConfigured = process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET;
if (githubConfigured) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: "/auth/github/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const name = profile.displayName || profile.username;
          const avatar_url = profile.photos && profile.photos[0] ? profile.photos[0].value : null;
          const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;

          let result = await pool.query(
            "SELECT * FROM users WHERE github_id = $1",
            [profile.id],
          );

          if (result.rows.length > 0) {
             // Atualiza informações
             const updatedUser = await pool.query(
              "UPDATE users SET name = $1, avatar_url = $2, email = COALESCE($3, email) WHERE id = $4 RETURNING *",
              [name, avatar_url, email, result.rows[0].id]
            );
            return done(null, updatedUser.rows[0]);
          }

          result = await pool.query(
            "INSERT INTO users (github_id, email, name, avatar_url, theme) VALUES ($1, $2, $3, $4, $5) RETURNING *",
            [profile.id, email, name, avatar_url, "light"],
          );
          done(null, result.rows[0]);
        } catch (err) {
          done(err, null);
        }
      },
    ),
  );
}

// --- ROTAS DE AUTENTICAÇÃO ---

app.get(
  "/auth/google",
  (req, res, next) => {
    if (!googleConfigured) {
      return res.status(500).json({ error: "Google authentication not configured (missing env vars)" });
    }
    next();
  },
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: FRONTEND_URL }),
  (req, res) => {
    res.redirect(`${FRONTEND_URL}/app`);
  },
);

app.get(
  "/auth/github",
  (req, res, next) => {
    if (!githubConfigured) {
      return res.status(500).json({ error: "GitHub authentication not configured (missing env vars)" });
    }
    next();
  },
  passport.authenticate("github", { scope: ["user:email"] }),
);

app.get(
  "/auth/github/callback",
  passport.authenticate("github", { failureRedirect: FRONTEND_URL }),
  (req, res) => {
    res.redirect(`${FRONTEND_URL}/app`);
  },
);

app.get("/api/me", (req, res) => {
  if (req.isAuthenticated()) {
    res.json(req.user);
  } else {
    res.status(401).json({ message: "Not authenticated" });
  }
});

app.post("/api/logout", (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ error: "Logout failed" });
    res.json({ message: "Logged out" });
  });
});

// Login Local (Email/Password)
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    const user = result.rows[0];

    if (!user) {
      // Registro implicito para manter compatibilidade com o comportamento anterior ("Entrar como Visitante")
      // Mas agora com senha hasheada se fornecida
      if (password) {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);
        const newUser = await pool.query(
          "INSERT INTO users (email, password, theme) VALUES ($1, $2, $3) RETURNING *",
          [email, hash, "light"],
        );
        // Logar automaticamente
        req.login(newUser.rows[0], (err) => {
          if (err) throw err;
          return res.json(newUser.rows[0]);
        });
        return;
      }
      return res.status(404).json({ error: "User not found" });
    }

    if (user.password) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch)
        return res.status(400).json({ error: "Invalid credentials" });
    } else {
      // Usuario oauth tentando logar com senha? Ou usuario antigo sem senha (do codigo anterior)?
      // Se for usuario do codigo anterior (senha "123456" hardcoded na criacao), a comparacao vai falhar pois nao é hash.
      // Vamos permitir se a senha for "123456" e atualizar para hash?
      // Simplificacao: Se nao tem password hash no banco, nega ou pede reset.
      // Para este prototipo: se password eh null, erro.
      return res.status(400).json({ error: "Use OAuth login" });
    }

    req.login(user, (err) => {
      if (err) throw err;
      res.json(user);
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ROTAS DA API DE RECURSOS ---
// Middleware de protecao
const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ error: "Unauthorized" });
};

app.put("/api/users/:id", ensureAuthenticated, async (req, res) => {
  if (parseInt(req.params.id) !== req.user.id)
    return res.status(403).json({ error: "Forbidden" });

  const { name, avatar_url, email, password, view_mode } = req.body;

  try {
    // Validações básicas
    if (email) {
      const emailCheck = await pool.query(
        "SELECT id FROM users WHERE email = $1 AND id != $2",
        [email, req.user.id]
      );
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ error: "Email já está em uso." });
      }
    }

    let passwordHash = undefined;
    if (password) {
        const salt = await bcrypt.genSalt(10);
        passwordHash = await bcrypt.hash(password, salt);
    }

    // Construção dinâmica da query
    // Isso evita apagar dados se o campo não for enviado (embora o frontend deva enviar o estado atual)
    // Mas para segurança, vamos atualizar apenas o que foi enviado ou manter o atual se for null/undefined na lógica do SQL?
    // Simplificação: Vamos assumir que o frontend envia os campos que quer editar.
    // Melhor: Fazer um UPDATE seletivo.

    // Vamos buscar o usuário atual para manter dados não enviados, ou usar COALESCE no SQL
    
    // Query segura com COALESCE para atualizar apenas se o valor não for NULL (exceto avatar que pode querer limpar? vamos assumir string vazia para limpar)
    
    // NOTA: Se o usuário quiser remover o avatar, deve enviar string vazia? 
    // Vamos considerar que null ou undefined no body significa "não alterar".
    
    const fields = [];
    const values = [];
    let idx = 1;

    if (name !== undefined) {
      fields.push(`name = $${idx++}`);
      values.push(name);
    }
    if (avatar_url !== undefined) {
      fields.push(`avatar_url = $${idx++}`);
      values.push(avatar_url);
    }
    if (email !== undefined) {
      fields.push(`email = $${idx++}`);
      values.push(email);
    }
    if (view_mode !== undefined) {
      fields.push(`view_mode = $${idx++}`);
      values.push(view_mode);
    }
    if (passwordHash !== undefined) {
      fields.push(`password = $${idx++}`);
      values.push(passwordHash);
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: "Nenhum dado para atualizar." });
    }

    values.push(req.user.id);
    const query = `UPDATE users SET ${fields.join(", ")} WHERE id = $${idx} RETURNING id, email, name, avatar_url, theme, view_mode, google_id, github_id`;
    
    const result = await pool.query(query, values);
    
    // Atualizar a sessão se necessário (opcional, mas bom para consistência imediata se usar passport session)
    // Passport session armazena o user ID geralmente, e deserializa a cada request.
    // Como deserializamos do banco a cada request, a próxima requisição já pegará os dados novos.
    
    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao atualizar perfil." });
  }
});

app.put("/api/users/:id/theme", ensureAuthenticated, async (req, res) => {
  // Garantir que so altera o proprio tema
  if (parseInt(req.params.id) !== req.user.id)
    return res.status(403).json({ error: "Forbidden" });

  const { theme } = req.body;
  try {
    const result = await pool.query(
      "UPDATE users SET theme = $1 WHERE id = $2 RETURNING *",
      [theme, req.params.id],
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- TABS API ---

app.get("/api/tabs/:userId", ensureAuthenticated, async (req, res) => {
    if (parseInt(req.params.userId) !== req.user.id)
        return res.status(403).json({ error: "Forbidden" });

    try {
        const result = await pool.query(
            "SELECT * FROM tabs WHERE user_id = $1 ORDER BY order_index ASC, id ASC",
            [req.params.userId]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/api/tabs", ensureAuthenticated, async (req, res) => {
    const { name } = req.body;
    try {
        const maxOrder = await pool.query("SELECT MAX(order_index) as max FROM tabs WHERE user_id = $1", [req.user.id]);
        const order_index = (maxOrder.rows[0].max || 0) + 1;

        const result = await pool.query(
            "INSERT INTO tabs (user_id, name, order_index) VALUES ($1, $2, $3) RETURNING *",
            [req.user.id, name, order_index]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put("/api/tabs/:id", ensureAuthenticated, async (req, res) => {
    const { name, order_index } = req.body;
    try {
        const fields = [];
        const values = [];
        let idx = 1;

        if (name !== undefined) { fields.push(`name = $${idx++}`); values.push(name); }
        if (order_index !== undefined) { fields.push(`order_index = $${idx++}`); values.push(order_index); }

        values.push(req.params.id);
        values.push(req.user.id);

        const query = `UPDATE tabs SET ${fields.join(", ")} WHERE id = $${idx++} AND user_id = $${idx} RETURNING *`;
        
        const result = await pool.query(query, values);
        if (result.rows.length === 0) return res.status(404).json({error: "Tab not found"});
        
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete("/api/tabs/:id", ensureAuthenticated, async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // Manually decouple tags to ensure they are not deleted even if FK constraint is wrong
        await client.query("UPDATE tags SET tab_id = NULL WHERE tab_id = $1 AND user_id = $2", [req.params.id, req.user.id]);

        const result = await client.query(
            "DELETE FROM tabs WHERE id = $1 AND user_id = $2 RETURNING *",
            [req.params.id, req.user.id]
        );
        
        if (result.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: "Tab not found" });
        }

        await client.query('COMMIT');
        res.json({ message: "Tab deleted" });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

app.put("/api/tabs/:id/reorder", ensureAuthenticated, async (req, res) => {
    const { tabIds } = req.body;
    
    if (!Array.isArray(tabIds)) {
        return res.status(400).json({ error: "tabIds must be an array" });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        for (let i = 0; i < tabIds.length; i++) {
            const tabId = tabIds[i];
            await client.query(
                "UPDATE tabs SET order_index = $1 WHERE id = $2 AND user_id = $3",
                [i, tabId, req.user.id]
            );
        }

        await client.query('COMMIT');
        res.json({ message: "Tabs reordered" });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// --- TAGS API ---

app.get("/api/tags/:userId", ensureAuthenticated, async (req, res) => {
    if (parseInt(req.params.userId) !== req.user.id)
        return res.status(403).json({ error: "Forbidden" });

    try {
        const result = await pool.query(
            "SELECT * FROM tags WHERE user_id = $1 ORDER BY order_index ASC, name ASC",
            [req.params.userId]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/api/tags", ensureAuthenticated, async (req, res) => {
    const { name, color, tab_id } = req.body;
    try {
        // Obter o maior order_index
        const maxOrder = await pool.query("SELECT MAX(order_index) as max FROM tags WHERE user_id = $1", [req.user.id]);
        const order_index = (maxOrder.rows[0].max || 0) + 1;

        const result = await pool.query(
            "INSERT INTO tags (user_id, name, color, order_index, tab_id) VALUES ($1, $2, $3, $4, $5) RETURNING *",
            [req.user.id, name, color || '#3b82f6', order_index, tab_id || null]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put("/api/tags/:id", ensureAuthenticated, async (req, res) => {
    const { name, color, order_index, tab_id } = req.body;
    try {
        const fields = [];
        const values = [];
        let idx = 1;
        
        if (name !== undefined) { fields.push(`name = $${idx++}`); values.push(name); }
        if (color !== undefined) { fields.push(`color = $${idx++}`); values.push(color); }
        if (order_index !== undefined) { fields.push(`order_index = $${idx++}`); values.push(order_index); }
        if (tab_id !== undefined) { fields.push(`tab_id = $${idx++}`); values.push(tab_id); }
        
        values.push(req.params.id);
        values.push(req.user.id);
        
        const query = `UPDATE tags SET ${fields.join(", ")} WHERE id = $${idx++} AND user_id = $${idx} RETURNING *`;
        
        const result = await pool.query(query, values);
        if (result.rows.length === 0) return res.status(404).json({error: "Tag not found"});
        
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete("/api/tags/:id", ensureAuthenticated, async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM tags WHERE id = $1 AND user_id = $2 RETURNING *",
      [req.params.id, req.user.id],
    );
    if (result.rowCount === 0)
      return res
        .status(404)
        .json({ error: "Tag not found or permission denied" });
    res.json({ message: "Tag removida" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/tags/:id/reorder", ensureAuthenticated, async (req, res) => {
    const { linkIds } = req.body;
    const tagId = parseInt(req.params.id);

    if (!Array.isArray(linkIds)) {
        return res.status(400).json({ error: "linkIds must be an array" });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // Verify ownership of the tag (optional but good security)
        const tagCheck = await client.query("SELECT id FROM tags WHERE id = $1 AND user_id = $2", [tagId, req.user.id]);
        if (tagCheck.rows.length === 0) {
            throw new Error("Tag not found or permission denied");
        }

        for (let i = 0; i < linkIds.length; i++) {
            const linkId = linkIds[i];
            await client.query(
                "UPDATE link_tags SET order_index = $1 WHERE tag_id = $2 AND link_id = $3",
                [i, tagId, linkId]
            );
        }

        await client.query('COMMIT');
        res.json({ message: "Order updated" });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});


// --- LINKS API ---

app.get("/api/links/:userId", ensureAuthenticated, async (req, res) => {
  if (parseInt(req.params.userId) !== req.user.id)
    return res.status(403).json({ error: "Forbidden" });

  try {
    const query = `
      SELECT l.*, 
      COALESCE(
        json_agg(json_build_object('id', t.id, 'name', t.name, 'color', t.color, 'order_index', lt.order_index)) 
        FILTER (WHERE t.id IS NOT NULL), 
        '[]'
      ) as tags
      FROM links l
      LEFT JOIN link_tags lt ON l.id = lt.link_id
      LEFT JOIN tags t ON lt.tag_id = t.id
      WHERE l.user_id = $1
      GROUP BY l.id
      ORDER BY l.order_index ASC
    `;
    const result = await pool.query(query, [req.params.userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/links", ensureAuthenticated, async (req, res) => {
  const { user_id, title, url, icon_url, order_index, tags } = req.body;
  if (parseInt(user_id) !== req.user.id)
    return res.status(403).json({ error: "Forbidden" });

  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await client.query(
      "INSERT INTO links (user_id, title, url, icon_url, order_index) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [user_id, title, url, icon_url, order_index],
    );
    const link = result.rows[0];

    if (tags && Array.isArray(tags) && tags.length > 0) {
        for (const tagId of tags) {
            await client.query(
                "INSERT INTO link_tags (link_id, tag_id) VALUES ($1, $2)",
                [link.id, tagId]
            );
        }
    }
    
    const finalResult = await client.query(`
        SELECT l.*, 
        COALESCE(
            json_agg(json_build_object('id', t.id, 'name', t.name, 'color', t.color, 'order_index', lt.order_index)) 
            FILTER (WHERE t.id IS NOT NULL), 
            '[]'
        ) as tags
        FROM links l
        LEFT JOIN link_tags lt ON l.id = lt.link_id
        LEFT JOIN tags t ON lt.tag_id = t.id
        WHERE l.id = $1
        GROUP BY l.id
    `, [link.id]);

    await client.query('COMMIT');
    res.json(finalResult.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

app.put("/api/links/:id", ensureAuthenticated, async (req, res) => {
  const { title, url, icon_url, order_index, tags } = req.body;
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const result = await client.query(
      "UPDATE links SET title = $1, url = $2, icon_url = $3, order_index = $4 WHERE id = $5 AND user_id = $6 RETURNING *",
      [title, url, icon_url, order_index, req.params.id, req.user.id],
    );
    
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: "Link not found or permission denied" });
    }

    const link = result.rows[0];

    // Update tags: Remove all old ones, insert new ones
    await client.query("DELETE FROM link_tags WHERE link_id = $1", [link.id]);

    if (tags && Array.isArray(tags) && tags.length > 0) {
        for (const tagId of tags) {
            await client.query(
                "INSERT INTO link_tags (link_id, tag_id) VALUES ($1, $2)",
                [link.id, tagId]
            );
        }
    }

    // Fetch complete link
     const finalResult = await client.query(`
        SELECT l.*, 
        COALESCE(
            json_agg(json_build_object('id', t.id, 'name', t.name, 'color', t.color, 'order_index', lt.order_index)) 
            FILTER (WHERE t.id IS NOT NULL), 
            '[]'
        ) as tags
        FROM links l
        LEFT JOIN link_tags lt ON l.id = lt.link_id
        LEFT JOIN tags t ON lt.tag_id = t.id
        WHERE l.id = $1
        GROUP BY l.id
    `, [link.id]);

    await client.query('COMMIT');
    res.json(finalResult.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

app.delete("/api/links/:id", ensureAuthenticated, async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM links WHERE id = $1 AND user_id = $2 RETURNING *",
      [req.params.id, req.user.id],
    );
    if (result.rowCount === 0)
      return res
        .status(404)
        .json({ error: "Link not found or permission denied" });
    res.json({ message: "Link removido" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve static assets in production or local testing with build
if (!process.env.VERCEL) {
  const distPath = path.join(__dirname, "dist");
  const indexPath = path.resolve(__dirname, "dist", "index.html");

  if (fs.existsSync(indexPath)) {
    app.use(express.static(distPath));

    app.get("*", (req, res) => {
      // Verifica se é uma rota de API antes de retornar o HTML
      if (req.url.startsWith('/api/') || req.url.startsWith('/auth/')) {
        return res.status(404).json({ error: 'Not found' });
      }
      res.sendFile(indexPath);
    });
  } else {
    // Fallback for development mode when build is not ready
    app.get("*", (req, res) => {
      res.send(`
        <html>
          <head><title>LinkHub API</title></head>
          <body style="font-family: sans-serif; text-align: center; padding: 50px;">
            <h1>LinkHub API is Running 🚀</h1>
            <p>You are currently accessing the Backend API on port ${PORT}.</p>
            <p>The frontend build (dist/index.html) was not found.</p>
            <p>If you are in development mode, please access the frontend via the Vite Dev Server:</p>
            <p><a href="http://localhost:5173" style="font-size: 1.2em; font-weight: bold; color: blue;">Go to http://localhost:5173</a></p>
            <p style="font-size: 0.8em; color: gray; margin-top: 20px;">(Note: FRONTEND_URL is configured as: ${FRONTEND_URL})</p>
          </body>
        </html>
      `);
    });
  }
}

const PORT = process.env.PORT || 5000;
if (!process.env.VERCEL) {
  app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
}

export default app;
