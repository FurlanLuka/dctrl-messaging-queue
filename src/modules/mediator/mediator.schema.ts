import { t, type Static } from "elysia";

const enqueueSchema = t.Object({
  cmd: t.Literal("ENQUEUE"),
  data: t.Object({
    recipient: t.String(),
    event: t.String(),
    stream_id: t.String(),
    created_at: t.Number(),
  }),
});

const ackSchema = t.Object({
  cmd: t.Literal("ACK"),
  data: t.Object({
    id: t.String(),
  }),
});

const saveSchema = t.Object({
  cmd: t.Literal("SAVE"),
  data: t.Object({
    id: t.String(),
    recipient: t.String(),
    sender: t.String(),
    event: t.String(),
    stream_id: t.String(),
    created_at: t.Number(),
  }),
});

const fetchSchema = t.Object({
  cmd: t.Literal("FETCH"),
  data: t.Object({
    stream_id: t.String(),
  }),
});

const fetchQueueSchema = t.Object({
  cmd: t.Literal("FETCH_QUEUE"),
});

export const websocketConnectionRequestSchema = {
  query: t.Object({
    dctrl: t.String(),
    registry_signature: t.String(),
    identity_signature: t.String(),
    handshake_key: t.String(),
  }),
  body: t.Union([
    enqueueSchema,
    ackSchema,
    saveSchema,
    fetchSchema,
    fetchQueueSchema,
  ]),
};

export type WebsocketConnectionParams = Static<
  typeof websocketConnectionRequestSchema.query
>;
