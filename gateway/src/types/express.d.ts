import { Caller } from "../auth/apiKeyRegistry";

type User = {
  sub: string;
  role: string;
};

declare global {
  namespace Express {
    interface Request {
      caller?: Caller;
      user?: User;
    }
  }
}
