const express = require("express");
const multer = require("multer");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const amqp = require("amqplib");
require("dotenv").config();

const Video = require("./models/Video");

const app = express();

app.use(cors());
app.use(express.json());

// ✅ Serve processed videos
app.use("/uploads", express.static("uploads"));

// MongoDB
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("Mongo Connected"))
  .catch(err => console.log(err));

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + file.originalname;
    cb(null, unique);
  }
});

const upload = multer({ storage });

// ------------------ RABBITMQ ------------------

async function sendToQueue(data) {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL);
    const channel = await connection.createChannel();

    await channel.assertQueue(process.env.QUEUE_NAME, {
      durable: true
    });

    channel.sendToQueue(
      process.env.QUEUE_NAME,
      Buffer.from(JSON.stringify(data)),
      { persistent: true }
    );

    setTimeout(() => {
      connection.close();
    }, 500);

  } catch (err) {
    console.log("RabbitMQ Error:", err);
  }
}

// ------------------ UPLOAD API ------------------

app.post("/upload", upload.single("video"), async (req, res) => {
  try {
    const { name, email, resolution } = req.body;

    const video = await Video.create({
      name,
      email,
      originalVideo: req.file.filename,
      resolution,
      status: "pending"
    });

    await sendToQueue({
      videoId: video._id,
      fileName: req.file.filename,
      resolution
    });

    res.json({
      success: true,
      videoId: video._id
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Upload failed" });
  }
});

// ------------------ STATUS API ------------------

app.get("/status/:id", async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);

    res.json({
      videoId: video._id,
      status: video.status,
      processedVideo: video.processedVideo
    });

  } catch (err) {
    res.status(500).json({ error: "Video not found" });
  }
});

// ------------------ HEALTH CHECK ------------------

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// ------------------ START SERVER ------------------

app.listen(5000, () => {
  console.log("Backend running on port 5000");
});