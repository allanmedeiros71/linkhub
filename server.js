import express from "express";
import pkg from "pg";
import cors from "cors";
import "dotenv/config";

const { Pool } = pkg;
const app = express();

app.use(cors());
app.use(express.json());

// Configuração da ligação ao PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER || "user",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "linkhub",
  password: process.env.DB_PASSWORD || "password",
  port: process.env.DB_PORT || 5432,
});

// Inicialização das tabelas
const initDB = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS links (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      title VARCHAR(255) NOT NULL,
      url TEXT NOT NULL,
      order_index INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    await pool.query(query);
    console.log("Base de dados pronta.");
  } catch (err) {
    console.error("Erro ao inicializar base de dados:", err);
  }
};
initDB();

app.post("/api/login", async (req, res) => {
  const { email } = req.body;
  try {
    let user = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (user.rows.length === 0) {
      user = await pool.query(
        "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *",
        [email, "123456"]
      );
    }
    res.json(user.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/links/:userId", async (req, res) => {
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

app.post("/api/links", async (req, res) => {
  const { user_id, title, url, order_index } = req.body;
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

app.put("/api/links/:id", async (req, res) => {
  const { title, url, order_index } = req.body;
  try {
    const result = await pool.query(
      "UPDATE links SET title = $1, url = $2, order_index = $3 WHERE id = $4 RETURNING *",
      [title, url, order_index, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/links/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM links WHERE id = $1", [req.params.id]);
    res.json({ message: "Link removido" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Servidor a correr na porta ${PORT}`));
