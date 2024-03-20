import { Elysia, NotFoundError } from "elysia";
import {
  getIdentity,
  registerIdentity,
  updateIdentityRecord,
} from "./modules/registry/registry.service";
import {
  getIdentityRequestSchema,
  registerIdentityRequestSchema,
} from "./modules/registry/registry.schema";
import { getAuthHandshakeSchema } from "./modules/auth/auth.schema";
import {
  parseHandshakeKey,
  requestHandshakeMaterials,
} from "./modules/auth/auth.service";
import { websocketConnectionRequestSchema } from "./modules/mediator/mediator.schema";
import { db } from "./database";
import { eventLogRepository, eventQueueRepository } from "./schema";
import { and, eq, sql } from "drizzle-orm";
import { cors } from "@elysiajs/cors";

export const mediatorKeyPair = {
  publicKey: process.env.MEDIATOR_PUBLIC_KEY as string,
  privateKey: process.env.MEDIATOR_PRIVATE_KEY as string,
};

export const httpServer = new Elysia()
  .use(cors())
  .get("/.well-known/pbk.json", () => {
    return {
      pbk: mediatorKeyPair.publicKey,
    };
  })
  .get(
    ":dctrl",
    async ({ params }) => {
      const identity = await getIdentity(params.dctrl);

      if (identity === undefined) {
        throw new NotFoundError();
      }

      return identity;
    },
    getIdentityRequestSchema
  )
  .post(
    ":dctrl",
    async ({ params, body }) => {
      return registerIdentity(params.dctrl, body);
    },
    registerIdentityRequestSchema
  )
  .put(
    ":dctrl",
    async ({ params, body }) => {
      return updateIdentityRecord(params.dctrl, body);
    },
    registerIdentityRequestSchema
  )
  .get(
    ":dctrl/handshake",
    async ({ params }) => {
      return requestHandshakeMaterials(params.dctrl);
    },
    getAuthHandshakeSchema
  );

export const registerWebsocketRoutes = () => {
  httpServer.ws("/", {
    open: (ws) => {
      try {
        parseHandshakeKey(
          ws.data.query.dctrl,
          ws.data.query.handshake_key,
          ws.data.query.registry_signature,
          ws.data.query.identity_signature
        );
      } catch (err) {
        ws.close();
      }
    },
    message: async (ws, message) => {
      if (message.cmd === "ENQUEUE") {
        const identity = await getIdentity(message.data.recipient);

        if (identity === undefined) {
          return ws.send({
            type: "error",
            code: "ERR_RECIPIENT_NOT_FOUND",
          });
        }

        await db
          .insert(eventQueueRepository)
          .values({
            id: sql.placeholder("id"),
            recipient: sql.placeholder("recipient"),
            sender: sql.placeholder("sender"),
            event: sql.placeholder("event"),
            stream_id: sql.placeholder("stream_id"),
            created_at: sql.placeholder("created_at"),
          })
          .prepare()
          .execute({
            id: crypto.randomUUID(),
            recipient: message.data.recipient,
            sender: ws.data.query.dctrl,
            event: message.data.event,
            stream_id: message.data.stream_id,
            created_at: message.data.created_at,
          });

        return ws.send({
          type: "enqueued",
          id: crypto.randomUUID(),
        });
      } else if (message.cmd === "ACK") {
        await db
          .delete(eventQueueRepository)
          .where(eq(eventQueueRepository.id, sql.placeholder("id")))
          .prepare()
          .execute({
            id: message.data.id,
          });

        return ws.send({
          type: "acknowledged",
          id: message.data.id,
        });
      } else if (message.cmd === "SAVE") {
        await db
          .insert(eventLogRepository)
          .values({
            id: sql.placeholder("id"),
            owner: sql.placeholder("owner"),
            recipient: sql.placeholder("recipient"),
            sender: sql.placeholder("sender"),
            event: sql.placeholder("event"),
            stream_id: sql.placeholder("stream_id"),
            created_at: sql.placeholder("created_at"),
          })
          .prepare()
          .execute({
            id: message.data.id,
            owner: ws.data.query.dctrl,
            recipient: message.data.recipient,
            sender: message.data.sender,
            event: message.data.event,
            stream_id: message.data.stream_id,
            created_at: message.data.created_at,
          });

        return ws.send({
          type: "saved",
          id: message.data.id,
        });
      } else if (message.cmd === "FETCH") {
        const result = await db.query.eventLogRepository
          .findMany({
            where: and(
              eq(eventLogRepository.owner, sql.placeholder("owner")),
              eq(eventLogRepository.stream_id, sql.placeholder("stream_id"))
            ),
            orderBy: (eventLog, { asc }) => [asc(eventLog.created_at)],
          })
          .prepare()
          .execute({
            owner: ws.data.query.dctrl,
            stream_id: message.data.stream_id,
          });

        return ws.send({
          type: "fetched",
          data: result,
        });
      } else if (message.cmd === "FETCH_QUEUE") {
        const result = await db.query.eventQueueRepository
          .findMany({
            where: eq(
              eventQueueRepository.recipient,
              sql.placeholder("recipient")
            ),
            orderBy: (eventLog, { asc }) => [asc(eventLog.created_at)],
            limit: 25,
          })
          .prepare()
          .execute({
            recipient: ws.data.query.dctrl,
          });

        return ws.send({
          type: "queue_fetched",
          data: result,
        });
      }
    },
    ...websocketConnectionRequestSchema,
  });
};

export type HttpServer = typeof httpServer;
