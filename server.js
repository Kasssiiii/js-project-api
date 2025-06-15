import cors from "cors";
import express from "express";
import data from "./data.json";
import crypto from "crypto";
import moment from "moment";
import { error } from "console";

// Defines the port the app will run on. Defaults to 8080, but can be overridden
// when starting the server. Example command to overwrite PORT env variable value:
// PORT=9000 npm start
const port = process.env.PORT || 8080;
const app = express();

// Add middlewares to enable cors and json body parsing
app.use(cors());
app.use(express.json());

// Start defining your routes here
app.get("/", (req, res) => {
  res.send("Hello Technigo!");
});

app.get("/thoughts", (req, res) => {
  res.json(data);
});

//sending a single thought
app.get("/thoughts/:thoughtId", (req, res) => {
  const id = req.params.thoughtId;
  const post = data.filter((item) => {
    return item._id === id;
  });
  if (post.length === 0) {
    res.status(404).json({ error: "Thought not found" });
  }
  res.json(post[0]);
});

// accepting/ adding a new thought
app.post("/thoughts", (req, res) => {
  const note = req.body.message;

  if (!note) {
    res.status(400).send({ error: "Could not save thought. Message missing" });
    return;
  }

  if (note.length < 5) {
    res
      .status(400)
      .send({ error: "Text is shorter than minimum allowed lenght of 5" });
    return;
  }

  const id = crypto.randomBytes(12).toString("hex");
  const date = moment().format();

  const thought = {
    _id: id,
    message: note,
    hearts: 0,
    createdAt: date,
    __v: 0,
  };

  data.unshift(thought);
  res.status(201).send(thought);
});

//liking a thought with a given ID
app.post("/thoughts/:thoughtId/like", (req, res) => {
  const id = req.params.thoughtId;
  const post = data.filter((item) => {
    return item._id === id;
  });
  if (post.length === 0) {
    res.status(404).json({ error: "Thought not found" });
  }
  post[0].hearts = post[0].hearts + 1;
  res.json(post[0]);
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
