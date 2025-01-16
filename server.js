const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public")); // Servir archivos estáticos desde la carpeta 'public'

// Conexión a la base de datos SQLite
const db = new sqlite3.Database("./database.db", (err) => {
  if (err) {
    console.error("Error al conectar con la base de datos:", err);
  } else {
    console.log("Conectado a la base de datos SQLite");
  }
});

// Crear tabla de usuarios si no existe
db.run(
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    email TEXT UNIQUE,
    password TEXT,
    bitcoin_wallet TEXT
  )`,
  (err) => {
    if (err) {
      console.error("Error al crear la tabla de usuarios:", err);
    } else {
      console.log("Tabla de usuarios lista");
    }
  }
);

// Variables globales para el sistema de números
let randomNumber = Math.floor(Math.random() * 52) + 1;
let lastGeneratedTime = Date.now();

// Actualiza el número cada 30 segundos
setInterval(() => {
  randomNumber = Math.floor(Math.random() * 52) + 1;
  lastGeneratedTime = Date.now();
  console.log(`Nuevo número generado: ${randomNumber}`);
}, 30000);

// Ruta para obtener el número actual
app.get("/current-number", (req, res) => {
  res.json({
    number: randomNumber,
    lastGeneratedTime,
  });
});

// Ruta para registrar un usuario
app.post("/register", async (req, res) => {
  const { username, email, password, bitcoin_wallet } = req.body;

  // Validación básica
  if (!username || !email || !password || !bitcoin_wallet) {
    return res.status(400).json({ error: "Todos los campos son obligatorios" });
  }

  try {
    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar el usuario en la base de datos
    db.run(
      `INSERT INTO users (username, email, password, bitcoin_wallet) VALUES (?, ?, ?, ?)`
      , [username, email, hashedPassword, bitcoin_wallet], (err) => {
        if (err) {
          if (err.code === "SQLITE_CONSTRAINT") {
            return res.status(400).json({ error: "Usuario o email ya existe" });
          }
          return res.status(500).json({ error: "Error al registrar usuario" });
        }
        res.status(201).json({ message: "Usuario registrado con éxito" });
      });
  } catch (err) {
    res.status(500).json({ error: "Error al procesar la solicitud" });
  }
});

// Ruta para iniciar sesión
app.post("/login", (req, res) => {
  const { usernameOrEmail, password } = req.body;

  if (!usernameOrEmail || !password) {
    return res.status(400).json({ error: "Usuario/email y contraseña son obligatorios" });
  }

  // Buscar al usuario en la base de datos
  db.get(
    `SELECT * FROM users WHERE username = ? OR email = ?`,
    [usernameOrEmail, usernameOrEmail],
    async (err, user) => {
      if (err) {
        return res.status(500).json({ error: "Error al buscar usuario" });
      }
      if (!user) {
        return res.status(400).json({ error: "Usuario o contraseña incorrectos" });
      }

      // Comparar la contraseña
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.status(400).json({ error: "Usuario o contraseña incorrectos" });
      }

      res.status(200).json({
        message: "Inicio de sesión exitoso",
        user: {
          username: user.username,
          email: user.email,
          bitcoin_wallet: user.bitcoin_wallet
        }
      });
    }
  );
});

// Inicia el servidor
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
