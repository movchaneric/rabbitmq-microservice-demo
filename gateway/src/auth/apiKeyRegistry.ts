export interface Caller {
  appName: string;
  plan: string; // "free" | "pro"
}

const registry = new Map<string, Caller>(
  (process.env.API_KEYS ?? "").split(",").map((entry) => {
    const [key, appName, plan] = entry.split(":");
    return [key, { appName, plan }];
  }),
);

export function lookup(apiKey: string): Caller | undefined {
  return registry.get(apiKey);
}
