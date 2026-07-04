import { createConnection, getChannel, getConnection } from "./connection";
import { setupTopology } from "./topology";
import { log } from "../logger";

export { getChannel };

export async function connect(): Promise<void> {
  const channel = await createConnection();
  await setupTopology(channel);
  log("RabbitMQ ready");

  // Attach close and error listerners incase connection drop
  // after connection has been made
  getConnection()?.on("close", () => {
    console.log("'RabbitMQ connection closed — reconnecting...'");
    reconnectForever()
  });

  getConnection()?.on("error", (err) =>
    log(`RabbitMQ connection error: ${(err as Error).message}`),
  );
}

async function reconnectForever(): Promise<void> {
  while (true) {
    try {
      await connect();
      return;
    } catch (err) {
      log("[Order service]: Coudnt connect to rabbmitmq retrying...");
      await new Promise((resolve, _reject) => setTimeout(resolve, 5000));
    }
  }
}
