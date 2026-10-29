require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("MongoDB connection error:", err.message));

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true }
}, { timestamps: true });

const postSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 150 },
  content: { type: String, required: true, trim: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  comments: [{
    text: { type: String, required: true, trim: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    authorName: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

const User = mongoose.model("User", userSchema);
const Post = mongoose.model("Post", postSchema);

function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return res.status(401).json({ message: "Please log in first." });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: "Session expired. Please log in again." });
  }
}

app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: "Name, email and password are required." });
    if (password.length < 6) return res.status(400).json({ message: "Password must contain at least 6 characters." });
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) return res.status(409).json({ message: "Email is already registered." });
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed });
    const token = jwt.sign({ id: user._id, name: user.name }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) { res.status(500).json({ message: "Could not register user." }); }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || "").toLowerCase().trim() });
    if (!user || !(await bcrypt.compare(password || "", user.password))) {
      return res.status(401).json({ message: "Invalid email or password." });
    }
    const token = jwt.sign({ id: user._id, name: user.name }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch { res.status(500).json({ message: "Could not log in." }); }
});

app.get("/api/posts", async (req, res) => {
  try {
    const posts = await Post.find().populate("author", "name").sort({ createdAt: -1 });
    res.json(posts);
  } catch { res.status(500).json({ message: "Could not load posts." }); }
});

app.post("/api/posts", auth, async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title?.trim() || !content?.trim()) return res.status(400).json({ message: "Title and content are required." });
    const post = await Post.create({ title: title.trim(), content: content.trim(), author: req.user.id });
    res.status(201).json(await post.populate("author", "name"));
  } catch { res.status(500).json({ message: "Could not create post." }); }
});

app.put("/api/posts/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found." });
    if (String(post.author) !== req.user.id) return res.status(403).json({ message: "You can edit only your own posts." });
    if (!req.body.title?.trim() || !req.body.content?.trim()) return res.status(400).json({ message: "Title and content are required." });
    post.title = req.body.title.trim();
    post.content = req.body.content.trim();
    await post.save();
    res.json(await post.populate("author", "name"));
  } catch { res.status(500).json({ message: "Could not update post." }); }
});

app.delete("/api/posts/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found." });
    if (String(post.author) !== req.user.id) return res.status(403).json({ message: "You can delete only your own posts." });
    await post.deleteOne();
    res.json({ message: "Post deleted." });
  } catch { res.status(500).json({ message: "Could not delete post." }); }
});

app.post("/api/posts/:id/comments", auth, async (req, res) => {
  try {
    const text = (req.body.text || "").trim();
    if (!text) return res.status(400).json({ message: "Comment cannot be empty." });
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found." });
    post.comments.push({ text, author: req.user.id, authorName: req.user.name });
    await post.save();
    res.status(201).json(post.comments[post.comments.length - 1]);
  } catch { res.status(500).json({ message: "Could not add comment." }); }
});

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Blog Platform running at http://localhost:${port}`));