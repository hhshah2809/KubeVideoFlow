require("dotenv").config();

const amqp = require("amqplib");
const mongoose = require("mongoose");
const { exec } = require("child_process");

const Video = require("./models/Video");

// MongoDB
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("Mongo Connected"))
  .catch(err => console.log(err));

// ------------------ WORKER START ------------------

async function startWorker() {
  let connection;

  // Retry RabbitMQ connection
  while (true) {
    try {
      console.log("Connecting to RabbitMQ...");
      connection = await amqp.connect(process.env.RABBITMQ_URL);
      console.log("Connected to RabbitMQ");
      break;
    } catch (err) {
      console.log("Retrying RabbitMQ in 5s...");
      await new Promise(r => setTimeout(r, 5000));
    }
  }

  const channel = await connection.createChannel();

  await channel.assertQueue(process.env.QUEUE_NAME, {
    durable: true
  });

  channel.prefetch(1);

  console.log("Worker waiting for jobs...");

  channel.consume(process.env.QUEUE_NAME, async (msg) => {
    if (!msg) return;

    const data = JSON.parse(msg.content.toString());
    console.log("Job received:", data);

    const inputPath = `/app/uploads/${data.fileName}`;
    const outputFile = "compressed-" + data.fileName;
    const outputPath = `/app/uploads/${outputFile}`;

    const ffmpegCmd = `ffmpeg -y -i "${inputPath}" -vf scale=640:360 "${outputPath}"`;

    exec(ffmpegCmd, async (err) => {
      if (err) {
        console.log("FFmpeg error:", err);
        return;
      }

      try {
        await Video.findByIdAndUpdate(data.videoId, {
          status: "completed",
          processedVideo: outputFile
        });

        console.log("Video processed:", outputFile);

        // ✅ ACK ONLY AFTER SUCCESS
        channel.ack(msg);

      } catch (dbErr) {
        console.log("DB error:", dbErr);
      }
    });

  }, {
    noAck: false
  });
}

startWorker();