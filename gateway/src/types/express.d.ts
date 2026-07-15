import { Caller } from "../auth/apiKeyRegistry";

declare global {
  namespace Express {
    interface Request {
      caller?: Caller;
    }
  }
}
