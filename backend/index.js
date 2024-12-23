require("dotenv").config();
const config = require("./config.json");
const mongoose = require("mongoose");
const express = require("express");

const cors = require("cors");

const jwt = require("jsonwebtoken");
const { authenticateToken } = require("./utilities");
const User = require("./models/user.model");
const Note = require("./models/note.model");

const app = express();

app.use(express.json());

app.use(
  cors({
    origin: "*",
  })
);

try {
  mongoose.connect(config.connectionString);
  console.log("DB Connected Successfully");
} catch (error) {
  console.log(error);
}

app.get("/", (req, res) => {
  res.send({ data: "Hello From Server" });
});

app.post("/register", async (req, res) => {
  const { email, fullName, password } = req.body;
  if (!fullName) {
    return res.status(400).json({
      error: true,
      message: "Full name is required",
    });
  }
  if (!email) {
    return res.status(400).json({
      error: true,
      message: "Email is required",
    });
  }
  if (!password) {
    return res.status(400).json({
      error: true,
      message: "Password is required",
    });
  }
  const isUser = await User.findOne({ email: email });
  if (isUser) {
    return res.json({
      error: true,
      message: "User already exist",
    });
  }
  const user = new User({
    fullName,
    email,
    password,
  });
  await user.save();

  const accessToken = jwt.sign({ user }, process.env.ACCESS_TOKEN_SECRETE, {
    expiresIn: "30m",
  });
  return res.json({
    error: false,
    user,
    accessToken,
    message: "Registration Successfull",
  });
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    return res.status(400).json({
      message: "Email is Required.",
    });
  }

  if (!password) {
    return res.status(400).json({
      message: "Password is Required.",
    });
  }

  const userInfo = await User.findOne({ email: email });
  if (!userInfo) {
    return res.status(400).json({
      message: "User Not Found",
    });
  }

  if (userInfo.email == email && userInfo.password == password) {
    const user = { user: userInfo };
    const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRETE, {
      expiresIn: "24h",
    });
    return res.json({
      error: false,
      message: "Login Success",
      email,
      accessToken,
    });
  } else {
    return res.status(400).json({
      error: true,
      message: "Invalid Creadentials",
    });
  }
});

app.get("/get-user", authenticateToken, async (req, res) => {
  const { user } = req.body;
  const isUser = await User.findOne({ _id: user._id });
  if (!isUser) {
    return res.status(401).json({ error: true, message: "User Not Found" });
  }
  return res.json({
    fullName: isUser.fullName,
    email: isUser.email,
    message: "User Details Fetched Successfully",
  });
});

app.post("/add-note", authenticateToken, async (req, res) => {
  const { title, content, tags } = req.body;
  const { user } = req.user;
  if (!title) {
    return res.status(400).json({ error: true, message: "Title is Required" });
  }
  if (!content) {
    return res
      .status(400)
      .json({ error: true, message: "Content is Required" });
  }

  try {
    const note = new Note({
      title,
      content,
      tags: tags || [],
      userId: user._id,
    });
    await note.save();

    return res.json({
      error: false,
      note,
      message: "Note Added Successfully",
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      error: true,
      message: "Internal Server Error",
    });
  }
});

app.put("/edit-note/:noteId", authenticateToken, async (req, res) => {
  const noteId = req.params.noteId;
  const { title, content, tags, isPinned } = req.body;
  const { user } = req.user;

  if (!title && !content && !tags) {
    return res.status(400).json({
      error: true,
      message: "No Changes Provided",
    });
  }

  try {
    const note = await Note.findOne({ _id: noteId, userId: user._id });
    if (!note) {
      return res.status(400).json({ error: true, message: "Note not Found" });
    }
    if (title) note.title = title;
    if (content) note.content = content;
    if (tags) note.tags = tags;
    if (isPinned) note.isPinned = isPinned;

    await note.save();
    return res.json({
      error: false,
      message: "Note Updated Successfully",
      note,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ error: true, message: "Internal Server Error" });
  }
});

app.get("/get-all-notes/", authenticateToken, async (req, res) => {
  const { user } = req.user;
  try {
    const notes = await Note.find({ userId: user._id }).sort({ isPinned: -1 });
    return res.json({
      error: false,
      notes,
      message: "All Notes Are Reterived Successfully",
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ error: true, message: "Internal Server Error" });
  }
});

app.delete("/delete-note/:noteId", authenticateToken, async (req, res) => {
  const noteId = req.params.noteId;
  const { user } = req.user;

  try {
    const note = await Note.findOne({ _id: noteId, userId: user._id });
    if (!note) {
      return res.status(400).json({ error: true, message: "Note not Found" });
    }

    await Note.deleteOne({ _id: noteId, userId: user._id });

    return res.json({
      error: false,
      message: "Note deleted Successfully",
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ error: true, message: "Internal Server Error" });
  }
});

app.put("/update-note-pinned/:noteId", authenticateToken, async (req, res) => {
  const noteId = req.params.noteId;
  const { isPinned } = req.body;
  const { user } = req.user;

  try {
    const note = await Note.findOne({ _id: noteId, userId: user._id });
    if (!note) {
      return res.status(400).json({ error: true, message: "Note not Found" });
    }

    if (isPinned) note.isPinned = isPinned || false;

    await note.save();
    return res.json({
      error: false,
      message: "Note Updated Successfully",
      note,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ error: true, message: "Internal Server Error" });
  }
});

app.listen(8000, () => {
  console.log("http://localhost:8000");
});

module.exports = app;
