import * as nobleCrypto from "@noble/curves/ed25519";

interface KeyPair {
  privateKey: string;
  publicKey: string;
}

export const generateKeyPair = async (): Promise<KeyPair> => {
  const privateKey = nobleCrypto.ed25519.utils.randomPrivateKey();
  const publicKey = nobleCrypto.ed25519.getPublicKey(privateKey);

  return {
    privateKey: Buffer.from(privateKey).toString("hex"),
    publicKey: Buffer.from(publicKey).toString("hex"),
  };
};

const createCryptoKey = async (
  encryptionKey: Uint8Array
): Promise<CryptoKey> => {
  return crypto.subtle.importKey("raw", encryptionKey, "AES-GCM", true, [
    "encrypt",
    "decrypt",
  ]);
};

export const generateSharedSecret = (privateKey: string, publicKey: string) => {
  return nobleCrypto.x25519.getSharedSecret(
    nobleCrypto.edwardsToMontgomeryPriv(Buffer.from(privateKey, "hex")),
    nobleCrypto.edwardsToMontgomeryPub(publicKey)
  );
};

export const verifyPublicKey = (publicKey: Uint8Array) => {
  return publicKey.length === 32;
};

export const encrypt = async (
  publicKey: string,
  privateKey: string,
  message: string
): Promise<string> => {
  const sharedSecret = generateSharedSecret(privateKey, publicKey);

  const cryptoKey = await createCryptoKey(sharedSecret);

  const iv = crypto.getRandomValues(new Uint8Array(16));
  const encodedMessage = new TextEncoder().encode(message);

  const encryptedMessage = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
    },
    cryptoKey,
    encodedMessage
  );

  return Buffer.concat([
    Buffer.from(iv),
    Buffer.from(encryptedMessage),
  ]).toString("hex");
};

export const decrypt = async (
  publicKey: string,
  privateKey: string,
  encryptedString: string
): Promise<string> => {
  const sharedSecret = generateSharedSecret(privateKey, publicKey);

  const cryptoKey = await createCryptoKey(sharedSecret);

  const encryptedBuffer = Buffer.from(encryptedString, "hex");

  const iv = encryptedBuffer.subarray(0, 16);
  const encryptedMessage = encryptedBuffer.subarray(16);

  const decryptedMessage = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv,
    },
    cryptoKey,
    encryptedMessage
  );

  return new TextDecoder().decode(decryptedMessage);
};

export const sign = (privateKey: string, message: string) => {
  return nobleCrypto.ed25519.sign(
    Buffer.from(message),
    Buffer.from(privateKey, "hex")
  );
};

export const verify = (
  publicKey: string,
  message: string,
  signature: string
) => {
  return nobleCrypto.ed25519.verify(
    Buffer.from(signature, "hex"),
    Buffer.from(message),
    Buffer.from(publicKey, "hex")
  );
};
