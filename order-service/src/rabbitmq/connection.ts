import amqp, { ConfirmChannel } from "amqplib";
import { log } from "../logger";

let channel: ConfirmChannel | null = null;

export async function createConnection(retries = 5): Promise<ConfirmChannel> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const connection = await amqp.connect(process.env.RABBITMQ_URL as string);
      // Confirm channel, not a plain channel: publish() below needs a
      // per-message callback so a failed/never-confirmed publish doesn't
      // silently look like a success to the caller.
      channel = await connection.createConfirmChannel();
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

export function getChannel(): ConfirmChannel | null {
  return channel;
}
