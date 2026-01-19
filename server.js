import express from "express";
import pkg from "pg";
import cors from "cors";
import "dotenv/config";
import session from "express-session";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import bcrypt from "bcryptjs";

const { Pool } = pkg;
const app = express();

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production", // set to true if https
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());

// Configuração da ligação ao PostgreSQL via Docker
const pool = new Pool({
  user: process.env.DB_USER || "user",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "linkhub",
  password: process.env.DB_PASSWORD || "password",
  port: process.env.DB_PORT || 5432,
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
        ALTER TABLE users ALTER COLUMN password DROP NOT NULL;
        ALTER TABLE users ALTER COLUMN email DROP NOT NULL; 
      END $$;
    `);
    // Note: email might be null for some oauth providers if they don't share it, though usually we want it.
    // Making email nullable just in case, or we enforce it in logic.

    console.log("Banco de dados PostgreSQL pronto e atualizado.");
  } catch (err) {
    console.error("Erro ao inicializar banco de dados:", err);
  }
};
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
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/auth/google/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Verifica se usuario ja existe pelo google_id
          let result = await pool.query(
            "SELECT * FROM users WHERE google_id = $1",
            [profile.id]
          );
          if (result.rows.length > 0) {
            return done(null, result.rows[0]);
          }

          // Se nao, verifica por email (se disponivel) para linkar contas (opcional, aqui simplificado cria novo)
          // Vamos criar um novo
          const email =
            profile.emails && profile.emails[0] ? profile.emails[0].value : null;
          result = await pool.query(
            "INSERT INTO users (google_id, email, theme) VALUES ($1, $2, $3) RETURNING *",
            [profile.id, email, "light"]
          );
          done(null, result.rows[0]);
        } catch (err) {
          done(err, null);
        }
      }
    )
  );
}

// GitHub Strategy
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: "/auth/github/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let result = await pool.query(
            "SELECT * FROM users WHERE github_id = $1",
            [profile.id]
          );
          if (result.rows.length > 0) {
            return done(null, result.rows[0]);
          }

          // Email pode ser privado no github
          const email =
            profile.emails && profile.emails[0] ? profile.emails[0].value : null;

          result = await pool.query(
            "INSERT INTO users (github_id, email, theme) VALUES ($1, $2, $3) RETURNING *",
            [profile.id, email, "light"]
          );
          done(null, result.rows[0]);
        } catch (err) {
          done(err, null);
        }
      }
    )
  );
}

// --- ROTAS DE AUTENTICAÇÃO ---

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: FRONTEND_URL }),
  (req, res) => {
    res.redirect(`${FRONTEND_URL}/app`);
  }
);

app.get(
  "/auth/github",
  passport.authenticate("github", { scope: ["user:email"] })
);

app.get(
  "/auth/github/callback",
  passport.authenticate("github", { failureRedirect: FRONTEND_URL }),
  (req, res) => {
    res.redirect(`${FRONTEND_URL}/app`);
  }
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
          [email, hash, "light"]
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
      if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });
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

app.put("/api/users/:id/theme", ensureAuthenticated, async (req, res) => {
    // Garantir que so altera o proprio tema
    if (parseInt(req.params.id) !== req.user.id) return res.status(403).json({ error: "Forbidden" });

  const { theme } = req.body;
  try {
    const result = await pool.query(
      "UPDATE users SET theme = $1 WHERE id = $2 RETURNING *",
      [theme, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/links/:userId", ensureAuthenticated, async (req, res) => {
  if (parseInt(req.params.userId) !== req.user.id) return res.status(403).json({ error: "Forbidden" });

  try {
    const result = await pool.query(
      "SELECT * FROM links WHERE user_id = $1 ORDER BY order_index ASC",
      [req.params.userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/links", ensureAuthenticated, async (req, res) => {
  const { user_id, title, url, order_index } = req.body;
  if (parseInt(user_id) !== req.user.id) return res.status(403).json({ error: "Forbidden" });

  try {
    const result = await pool.query(
      "INSERT INTO links (user_id, title, url, order_index) VALUES ($1, $2, $3, $4) RETURNING *",
      [user_id, title, url, order_index]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/links/:id", ensureAuthenticated, async (req, res) => {
  const { title, url, order_index } = req.body;
  // TODO: Verificar se o link pertence ao usuario
  try {
    const result = await pool.query(
      "UPDATE links SET title = $1, url = $2, order_index = $3 WHERE id = $4 AND user_id = $5 RETURNING *",
      [title, url, order_index, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({error: "Link not found or permission denied"});
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/links/:id", ensureAuthenticated, async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM links WHERE id = $1 AND user_id = $2 RETURNING *", [req.params.id, req.user.id]);
    if (result.rowCount === 0) return res.status(404).json({error: "Link not found or permission denied"});
    res.json({ message: "Link removido" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));