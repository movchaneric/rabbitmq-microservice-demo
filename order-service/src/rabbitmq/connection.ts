import amqp, { ChannelModel, ConfirmChannel } from "amqplib";
import { log } from "../logger";

let channel: ConfirmChannel | null = null;
let connection: ChannelModel | null = null;

export async function createConnection(retries = 5): Promise<ConfirmChannel> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      connection = await amqp.connect(process.env.RABBITMQ_URL as string);
      channel = await connection.createConfirmChannel();
      console.log("Connected to RabbitMQ");
      return channel;
    } catch (err) {
      console.error(
        `Connect attempt ${attempt}/${retries} failed: ${(err as Error).message}`,
      );
      if (attempt === retries) throw err;
      await new Promise((res) => setTimeout(res, 2000 * attempt));
    }
  }
  throw new Error("Failed to connect to RabbitMQ");
}

export function getChannel(): ConfirmChannel | null {
  return channel;
}

export function getConnection(): ChannelModel | null {
  return connection;
}
