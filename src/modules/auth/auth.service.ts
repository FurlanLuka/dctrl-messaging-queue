import { InternalServerError } from "elysia";
import { mediatorKeyPair } from "../../server";
import { verifyPublicKey, sign, verify } from "../../crypto";

export const parseHandshakeKey = (
  dctrl: string,
  handshakeKey: string,
  registrySignature: string,
  identitySignature: string
) => {
  const publicKey = handshakeKey.slice(0, 64);

  if (publicKey !== dctrl) {
    throw new InternalServerError();
  }

  const nonce = handshakeKey.slice(64, 128);

  const expiration = parseInt(handshakeKey.slice(128), 16);

  if (expiration < Date.now() / 1000) {
    throw new InternalServerError();
  }

  if (!verify(publicKey, registrySignature, identitySignature)) {
    throw new InternalServerError();
  }

  if (!verify(mediatorKeyPair.publicKey, handshakeKey, registrySignature)) {
    throw new InternalServerError();
  }

  return {
    publicKey,
    nonce,
    expiration,
  };
};

export const requestHandshakeMaterials = async (
  dctrl: string
): Promise<{
  handshake_key: string;
  registry_signature: string;
}> => {
  const publicKey = Buffer.from(dctrl, "hex");

  const expiration = Date.now() / 1000 + 60 * 5; // 5minutes

  if (!verifyPublicKey(publicKey)) {
    throw new InternalServerError();
  }

  const handshakeKey = Buffer.concat([
    publicKey,
    Buffer.from(crypto.getRandomValues(new Uint8Array(32))),
    Buffer.from(expiration.toString(16), "hex"),
  ]).toString("hex");

  const registrySignature = Buffer.from(
    sign(mediatorKeyPair.privateKey, handshakeKey)
  ).toString("hex");

  return {
    handshake_key: handshakeKey,
    registry_signature: registrySignature,
  };
};
