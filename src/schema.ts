import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

export const eventLogRepository = sqliteTable(
  "event_log",
  {
    id: text("id").notNull().primaryKey(),
    owner: text("owner").notNull(),
    sender: text("sender").notNull(),
    recipient: text("recipient").notNull(),
    event: text("event").notNull(),
    stream_id: text("stream_id").notNull(),
    created_at: integer("created_at").notNull(),
  },
  (table) => {
    return {
      idIdx: index("eventLog_idIdx").on(table.id),
      ownerIdx: index("eventLog_ownerIdx").on(table.owner),
      streamIdIdx: index("eventLog_streamIdIdx").on(table.stream_id),
      senderIdx: index("eventLog_senderIdx").on(table.sender),
      recipientIdx: index("eventLog_recipientIdx").on(table.recipient),
    };
  }
);

export interface EventLog {
  id: string;
  owner: string;
  sender: string;
  recipient: string;
  event: string;
  stream_id: string;
  created_at: number;
}

export const eventQueueRepository = sqliteTable(
  "event_queue",
  {
    id: text("id").notNull().primaryKey(),
    recipient: text("recipient").notNull(),
    sender: text("sender").notNull(),
    event: text("event").notNull(),
    stream_id: text("stream_id").notNull(),
    created_at: integer("created_at").notNull(),
  },
  (table) => {
    return {
      idIdx: index("eventQueue_idIdx").on(table.id),
      recipientIdx: index("eventQueue_recipientIdx").on(table.recipient),
      senderIdx: index("eventQueue_senderIdx").on(table.sender),
    };
  }
);

export interface EventQueue {
  id: string;
  recipient: string;
  sender: string;
  event: string;
  streak_id: string;
  created_at: number;
}

export const registryRepository = sqliteTable(
  "registry",
  {
    registry_signature: text("registry_signature").notNull(),
    identity_signature: text("identity_signature").notNull(),
    handshake_key: text("handshake_key").notNull(),
    data: text("data").notNull(),
    data_signature: text("data_signature").notNull(),
    dctrl: text("dctrl").notNull(),
    created_at: integer("created_at").notNull(),
  },
  (table) => {
    return {
      dctrl: index("registry_dctrl").on(table.dctrl),
    };
  }
);

export type RegistryData = {
  alias: string;
  mediator_addr: string[];
};

export interface Registry {
  dctrl: string;
  data: RegistryData;
  handshake_key: string;
  data_signature: string;
  registry_signature: string;
  identity_signature: string;
}
