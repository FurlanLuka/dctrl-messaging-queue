import { InternalServerError, NotFoundError, type Static } from "elysia";
import { eq, sql } from "drizzle-orm";
import { registerIdentityRequestSchema } from "./registry.schema";
import { verify } from "../../crypto";
import { db } from "../../database";
import { parseHandshakeKey } from "../auth/auth.service";
import { registryRepository, type Registry } from "../../schema";

export const getIdentity = async (
  dctrl: string
): Promise<Registry | undefined> => {
  const result = await db
    .select()
    .from(registryRepository)
    .where(eq(registryRepository.dctrl, sql.placeholder("dctrl")))
    .prepare()
    .execute({ dctrl });

  if (result.length !== 1) {
    return undefined;
  }

  const { created_at, ...record } = result[0];

  return {
    ...record,
    data: JSON.parse(record.data),
  };
};

export const registerIdentity = async (
  dctrl: string,
  body: Static<typeof registerIdentityRequestSchema.body>
): Promise<Registry> => {
  const identity = await getIdentity(dctrl);

  if (identity) {
    throw new InternalServerError();
  }

  const { publicKey } = parseHandshakeKey(
    dctrl,
    body.handshake_key,
    body.registry_signature,
    body.identity_signature
  );

  if (!verify(publicKey, JSON.stringify(body.data), body.data_signature)) {
    throw new InternalServerError();
  }

  const record = {
    registry_signature: body.registry_signature,
    identity_signature: body.identity_signature,
    handshake_key: body.handshake_key,
    data: JSON.stringify(body.data),
    data_signature: body.data_signature,
    dctrl,
    created_at: Date.now(),
  };

  await db
    .insert(registryRepository)
    .values({
      registry_signature: sql.placeholder("registry_signature"),
      identity_signature: sql.placeholder("identity_signature"),
      handshake_key: sql.placeholder("handshake_key"),
      data: sql.placeholder("data"),
      data_signature: sql.placeholder("data_signature"),
      dctrl: sql.placeholder("dctrl"),
      created_at: sql.placeholder("created_at"),
    })
    .prepare()
    .execute(record);

  return {
    ...record,
    data: JSON.parse(record.data),
  };
};

export const updateIdentityRecord = async (
  dctrl: string,
  body: Static<typeof registerIdentityRequestSchema.body>
): Promise<Registry> => {
  const identity = await getIdentity(dctrl);

  if (identity === undefined) {
    throw new NotFoundError();
  }

  const { publicKey } = parseHandshakeKey(
    dctrl,
    body.handshake_key,
    body.registry_signature,
    body.identity_signature
  );

  if (!verify(publicKey, JSON.stringify(body.data), body.data_signature)) {
    throw new InternalServerError();
  }

  const record = {
    registry_signature: body.registry_signature,
    identity_signature: body.identity_signature,
    handshake_key: body.handshake_key,
    data: JSON.stringify(body.data),
    data_signature: body.data_signature,
    dctrl,
  };

  await db
    .update(registryRepository)
    .set(record)
    .where(eq(registryRepository.dctrl, sql.placeholder("dctrl")))
    .prepare()
    .execute({
      dctrl,
    });
  return {
    ...record,
    data: JSON.parse(record.data),
  };
};
