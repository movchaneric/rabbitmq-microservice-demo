import amqp, { Channel } from "amqplib";
import { log } from "../logger";

let channel: Channel | null = null;

export async function createConnection(retries = 5): Promise<Channel> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const connection = await amqp.connect(process.env.RABBITMQ_URL as string);
      channel = await connection.createChannel();
      log("Connected to RabbitMQ");
      return channel;
    } catch (err) {
      log(
        `Connect attempt ${attempt}/${retries} failed: ${(err as Error).message}`,
      );
      if (attempt === retries) throw err;
      await new Promise((res) => setTimeout(res, 2000 * attempt));
    }
  }
  throw new Error("Failed to connect to RabbitMQ");
}

export function getChannel(): Channel | null {
  return channel;
}
