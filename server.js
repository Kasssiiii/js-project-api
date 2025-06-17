import cors from "cors";
import express from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import mongoose from "mongoose";

// loading environment from env file
dotenv.config();

//connecting to MondoDB
const mongoUrl = process.env.MONGO_URL || "mongodb://localhost/thoughts";
mongoose.connect(mongoUrl);

//data model for Thoughts
const thoughtSchema = new mongoose.Schema({
  _id: {
    type: String,
    unique: true,
    default: () => {
      return crypto.randomBytes(12).toString("hex");
    },
  },
  message: {
    type: String,
    require: true,
  },
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

//user schema
const User = mongoose.model("User", {
  name: {
    type: String,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  accessToken: {
    type: String,
    default: () => crypto.randomBytes(128).toString("hex"),
  },
});

//example of a user
//const user = new User({name: "Mary", password: bcrypt.hashSync("Maryspassword")});
//user.save();

// Defines the port the app will run on. Defaults to 8080, but can be overridden
// when starting the server. Example command to overwrite PORT env variable value:
// PORT=9000 npm start
const port = process.env.PORT || 8080;
const app = express();

// Add middlewares to enable cors and json body parsing
app.use(cors());
app.use(express.json());

//endpoint for creating a user
app.post("/users", async (req, res) => {
  const userName = req.body.user;
  const password = req.body.password;
  if (!userName || !password) {
    res
      .status(400)
      .send({ error: "Could not create user. User or password missing" });
    return;
  }
  try {
    const user = new User({
      name: userName,
      password: bcrypt.hashSync(password),
    });
    await user.save();
    res.status(201).send(user);
  } catch (error) {
    res.status(400).send({ error: error });
  }
});

//endpoint for logging
app.post("/users/:userName", async (req, res) => {
  const userName = req.params.userName;
  const passEncrypted = req.body.password;
  if (!passEncrypted) {
    res.json({ error: "password missing in the body of request" });
  }
  const user = await User.findOne({ name: userName });

  if (user && bcrypt.compareSync(passEncrypted, user.password)) {
    //success
    res.json({ userName: user.name, accessToken: user.accessToken });
  } else {
    //failure
    res.json({ notFound: true });
  }
});

///authenticating middleware
const authenticateUser = async (req, res, next) => {
  const user = await User.findOne({ accessToken: req.header("Authorization") });
  if (user) {
    req.user = user;
    next();
  } else {
    res.status(401).json({ error: "User logged out" });
  }
};

// Start defining your routes here
app.get("/", (req, res) => {
  res.send("Hello Technigo!");
});

//listing all the thoughts
app.get("/thoughts", async (req, res) => {
  const thoughts = await Thought.find().sort({createdAt: -1}).limit(20);
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

//removing a single thought
app.delete("/thoughts/:thoughtId", authenticateUser);
app.delete("/thoughts/:thoughtId", async (req, res) => {
  const id = req.params.thoughtId;
  const result = await Thought.deleteOne({
    _id: id,
  });
  if (result.deletedCount === 0) {
    res.status(404).json({ error: "Thought not found" });
  }
  res.json(result);
});

// accepting/ adding a new thought

app.post("/thoughts", authenticateUser);

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

app.post("/thoughts/:thoughtId/like", authenticateUser);

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

// Starting the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
