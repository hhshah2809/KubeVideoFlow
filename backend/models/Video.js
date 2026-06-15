const mongoose = require("mongoose");

const videoSchema = new mongoose.Schema(
    {
        name: String,
        email: String,
        originalVideo: String,
        resolution: String,
        status: {
            type: String,
            default: "pending"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "Video",
    videoSchema
);