import cors from "cors";
import express from "express";
import mongoose from "mongoose";

const mongoUrl = process.env.MONGO_URL || "mongodb://localhost/project-mongo";
mongoose.connect(mongoUrl);
mongoose.Promise = Promise;

const port = process.env.PORT || 8080;
const app = express();

app.use(cors());
app.use(express.json());

// Define the Thought model
const Thought = mongoose.model("Thought", {
  message: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 140,
  },
  hearts: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: () => new Date(),
  },
});

// Default route
app.get("/", (req, res) => {
  res.send("Welcome to the Happy Thoughts API!");
});

// GET /thoughts - Fetch the 20 most recent thoughts
app.get("/thoughts", async (req, res) => {
  try {
    const thoughts = await Thought.find()
      .sort({ createdAt: -1 }) // Sort by createdAt in descending order
      .limit(20); // Limit to 20 results
    res.status(200).json(thoughts);
  } catch (err) {
    res.status(400).json({ message: "Could not fetch thoughts", error: err });
  }
});

// POST /thoughts - Create a new thought
app.post("/thoughts", async (req, res) => {
  const { message } = req.body;

  try {
    const newThought = await new Thought({ message }).save();
    res.status(201).json(newThought);
  } catch (err) {
    res.status(400).json({
      message: "Could not save thought",
      errors: err.errors
    });
  }
});

// POST /thoughts/:thoughtId/like - Add a heart to a thought
app.post("/thoughts/:thoughtId/like", async (req, res) => {
  const { thoughtId } = req.params;

  try {
    const updatedThought = await Thought.findByIdAndUpdate(
      thoughtId,
      { $inc: { hearts: 1 } }, // Increment hearts by 1
      { new: true } // Return the updated document
    );

    if (!updatedThought) {
      res.status(404).json({ message: "Thought not found" });
    } else {
      res.status(200).json(updatedThought);
    }
  } catch (err) {
    res.status(400).json({ message: "Could not update hearts", error: err });
  }
});

// GET /endpoints - Documentation
app.get("/endpoints", (req, res) => {
  const apiDocumentation = [
    {
      path: "/",
      methods: ["GET"],
      middleware: ["anonymous"],
    },
    {
      path: "/thoughts",
      methods: ["GET", "POST"],
      middleware: ["anonymous"],
    },
    {
      path: "/thoughts/:thoughtId/like",
      methods: ["POST"],
      middleware: ["anonymous"],
    },
  ];
  res.status(200).json(apiDocumentation);
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
