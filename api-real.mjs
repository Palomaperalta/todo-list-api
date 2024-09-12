import express from "express";
import cors from "cors";
import pg from "pg";
const { Pool } = pg;

import "dotenv/config.js";

const app = express();
app.use(express.json());
app.use(cors());
app.disable("x-powered-by");

const executeQuery = async (text, values) => {
  const { PGHOST, PGDATABASE, PGUSER, PGPASSWORD } = process.env;
  const pool = new Pool({
    host: PGHOST,
    database: PGDATABASE,
    username: PGUSER,
    password: PGPASSWORD,
    port: 5432,
    ssl: {
      require: true,
    },
  });
  const client = await pool.connect();

  const res = await client.query(text, values);

  await client.release();
  return res;
};

app.get("/todos", async (req, res) => {
  const text = "SELECT * FROM todolist";
  const todosLosTodos = await executeQuery(text);
  return res.status(200).json(todosLosTodos.rows);
});

app.get("/todos/hechos", async (req, res) => {
  const text = "SELECT * FROM todolist WHERE hecho = true";
  const todosLosTodosHechos = await executeQuery(text);
  return res.status(200).json(todosLosTodosHechos.rows);
});

app.get("/todos/no-hechos", async (req, res) => {
  const text = "SELECT * FROM todolist WHERE hecho = false";
  const todosLosTodosNoHechos = await executeQuery(text);
  return res.status(200).json(todosLosTodosNoHechos.rows);
});

app.get("/todos/:id", async (req, res) => {
  const { id } = req.params;

  const text = "SELECT * FROM todolist WHERE id_todolist = $1 ";
  const values = [id];
  const todo = await executeQuery(text, values);
  if (todo.rows) {
    return res.status(200).json(todo.rows);
  } else {
    return res.status(404).json({ message: "tarea not found" });
  }
});

app.post("/todos", async (req, res) => {
  const { tarea, hecho } = req.body;

  const text =
    "INSERT INTO todolist(tarea_todo, hecho) VALUES($1, $2) RETURNING *";
  const values = [tarea, hecho];
  const todo = await executeQuery(text, values);
  res.status(201).json(todo);
});

app.patch("/todos/:id", async (req, res) => {
  const { id } = req.params;

  const { tarea, hecho } = req.body;

  let text = "";
  let values = [];
  console.log(hecho, id);

  if (tarea !== undefined && hecho !== undefined) {
    text =
      "UPDATE todolist SET hecho = $2, tarea_todo = $3 WHERE id_todolist = $1";
    values = [id, hecho, tarea];
  } else {
    if (tarea !== undefined) {
      text = "UPDATE todolist SET tarea_todo = $2 WHERE id_todolist = $1";
      values = [id, tarea];
    } else {
      if (hecho !== undefined) {
        console.log(hecho, id);
        text = "UPDATE todolist SET hecho = $2 WHERE id_todolist = $1";
        values = [id, hecho];
      }
    }
  }
  const todo = await executeQuery(text, values);
  return res.status(200).json(todo);
});

app.delete("/todos/:id", async (req, res) => {
  const { id } = req.params;
  const text = "DELETE FROM todolist WHERE id_todolist = $1";
  const values = [id];
  const todo = await executeQuery(text, values);
  if (todo.rows) {
    return res.status(200).json(todo.rows);
  } else {
    return res.status(404).json({ message: "tarea not found" });
  }
});

const PORT = process.env.PORT ?? 1234;

app.listen(PORT, () => {
  console.log(`server listening on port http://localhost:${PORT}`);
});

export default app;
