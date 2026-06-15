const amqp = require("amqplib");
require("dotenv").config();
let channel;

async function connectQueue() {

    const connection =
        await amqp.connect(
            process.env.RABBITMQ_URL
        );

    channel =
        await connection.createChannel();

    await channel.assertQueue(
        "video-processing"
    );

    console.log(
        "RabbitMQ Connected"
    );
}

function getChannel() {
    return channel;
}

module.exports = {
    connectQueue,
    getChannel
};