import { setupDatabase } from "./database";
import { httpServer, registerWebsocketRoutes } from "./server";

if (
  process.env.MEDIATOR_PUBLIC_KEY === undefined ||
  process.env.MEDIATOR_PRIVATE_KEY === undefined
) {
  throw new Error("MEDIATOR_PUBLIC_KEY and MEDIATOR_PRIVATE_KEY must be set");
}

setupDatabase();
registerWebsocketRoutes();

httpServer.listen(8080);
