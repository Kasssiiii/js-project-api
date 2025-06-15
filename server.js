import cors from "cors";
import express from "express";
import crypto from "crypto";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const mongoUrl = process.env.MONGO_URL || "mongodb://localhost/thoughts";
mongoose.connect(mongoUrl);

const thoughtSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => {
      return crypto.randomBytes(12).toString("hex");
    },
  },
  message: String,
  hearts: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  __v: {
    type: Number,
    default: 0,
  },
});

const Thought = mongoose.model("Thought", thoughtSchema);

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

app.get("/thoughts", async (req, res) => {
  const thoughts = await Thought.find();
  res.json(thoughts);
});

//sending a single thought
app.get("/thoughts/:thoughtId", async (req, res) => {
  const id = req.params.thoughtId;
  const post = await Thought.find({
    _id: id,
  });
  if (post.length === 0) {
    res.status(404).json({ error: "Thought not found" });
  }
  res.json(post[0]);
});

// accepting/ adding a new thought
app.post("/thoughts", async (req, res) => {
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

  const thought = new Thought({
    message: note,
  });
  await thought.save();
  res.status(201).send(thought);
});

//liking a thought with a given ID
app.post("/thoughts/:thoughtId/like", async (req, res) => {
  const id = req.params.thoughtId;
  try {
    const likedThought = await Thought.findOneAndUpdate(
      { _id: id },
      { $inc: { hearts: 1 } },
      { new: true }
    );

    res.status(201).json(likedThought);
  } catch (error) {
    res.status(404).json({
      error: "Thought not found",
    });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
