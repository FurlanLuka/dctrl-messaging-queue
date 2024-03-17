import { expect, test, describe } from "bun:test";
import { setupDatabase } from "../database";
import { generateKeyPair, sign, verify } from "../crypto";
import { httpServer, type HttpServer } from "../server";
import { edenFetch } from "@elysiajs/eden";

setupDatabase();
httpServer.listen(8080);
const fetch = edenFetch<HttpServer>("http://localhost:8080");

const identityKeyPair = await generateKeyPair();

describe("Auth flow", async () => {
  test("Identity requests handshake material", async () => {
    const getMediatorPublicKeyResponse = await fetch("/.well-known/pbk.json", {
      method: "GET",
    });

    if (getMediatorPublicKeyResponse.data === null) {
      throw new Error("Expected mediator public key response data");
    }

    expect(getMediatorPublicKeyResponse.data.pbk.length).toBe(64);

    const mediatorPublicKey = getMediatorPublicKeyResponse.data.pbk;

    const getHandshakeResponse = await fetch(`/:dctrl/handshake`, {
      method: "GET",
      params: {
        dctrl: identityKeyPair.publicKey,
      },
    });

    if (getHandshakeResponse.data === null) {
      throw new Error("Expected response data");
    }

    expect(getHandshakeResponse.data.handshake_key.length).toBe(136);
    expect(getHandshakeResponse.data.handshake_key.slice(0, 64)).toBe(
      identityKeyPair.publicKey
    );

    expect(
      verify(
        mediatorPublicKey,
        getHandshakeResponse.data.handshake_key,
        getHandshakeResponse.data.registry_signature
      )
    ).toBe(true);

    const getUnregisteredIdentityResponse = await fetch(`/:dctrl`, {
      method: "GET",
      params: {
        dctrl: identityKeyPair.publicKey,
      },
    });

    expect(getUnregisteredIdentityResponse.status).toBe(404);

    const identitySignature = Buffer.from(
      sign(
        identityKeyPair.privateKey,
        getHandshakeResponse.data.registry_signature
      )
    ).toString("hex");

    const data = {
      alias: "Mr. Robot",
      mediator_addr: ["http://localhost:8080"],
    };

    const dataSignature = Buffer.from(
      sign(identityKeyPair.privateKey, JSON.stringify(data))
    ).toString("hex");

    const registerIdentityResponse = await fetch(`/:dctrl`, {
      method: "POST",
      params: {
        dctrl: identityKeyPair.publicKey,
      },
      body: {
        handshake_key: getHandshakeResponse.data.handshake_key,
        registry_signature: getHandshakeResponse.data.registry_signature,
        identity_signature: identitySignature,
        data: data,
        data_signature: dataSignature,
      },
    });

    console.log("Handshake data", {
      dctrl: identityKeyPair.publicKey,
      handshake_key: getHandshakeResponse.data.handshake_key,
      registry_signature: getHandshakeResponse.data.registry_signature,
      identity_signature: identitySignature,
    });

    expect(registerIdentityResponse.status).toBe(200);

    const getRegisteredIdentityResponse = await fetch(`/:dctrl`, {
      method: "GET",
      params: {
        dctrl: identityKeyPair.publicKey,
      },
    });

    if (getRegisteredIdentityResponse.data === null) {
      throw new Error("Expected response data");
    }

    expect(getRegisteredIdentityResponse.data.dctrl).toBe(
      identityKeyPair.publicKey
    );
    expect(getRegisteredIdentityResponse.data.data).toEqual(data);
    expect(getRegisteredIdentityResponse.data.handshake_key).toStrictEqual(
      getHandshakeResponse.data.handshake_key
    );
    expect(getRegisteredIdentityResponse.data.registry_signature).toStrictEqual(
      getHandshakeResponse.data.registry_signature
    );
    expect(getRegisteredIdentityResponse.data.identity_signature).toStrictEqual(
      identitySignature
    );

    const updatedData = {
      alias: "Mr. Robot 2",
      mediator_addr: [],
    };

    const updatedDataSignature = Buffer.from(
      sign(identityKeyPair.privateKey, JSON.stringify(updatedData))
    ).toString("hex");

    const updateIdentityResponse = await fetch(`/:dctrl`, {
      method: "PUT",
      params: {
        dctrl: identityKeyPair.publicKey,
      },
      body: {
        handshake_key: getHandshakeResponse.data.handshake_key,
        registry_signature: getHandshakeResponse.data.registry_signature,
        identity_signature: identitySignature,
        data: updatedData,
        data_signature: updatedDataSignature,
      },
    });

    expect(updateIdentityResponse.status).toBe(200);

    const getUpdatedIdentityResponse = await fetch(`/:dctrl`, {
      method: "GET",
      params: {
        dctrl: identityKeyPair.publicKey,
      },
    });

    if (getUpdatedIdentityResponse.data === null) {
      throw new Error("Expected response data");
    }

    expect(getUpdatedIdentityResponse.data.dctrl).toBe(
      identityKeyPair.publicKey
    );
    expect(getUpdatedIdentityResponse.data.data).toEqual(updatedData);
    expect(getUpdatedIdentityResponse.data.handshake_key).toStrictEqual(
      getHandshakeResponse.data.handshake_key
    );
    expect(getUpdatedIdentityResponse.data.registry_signature).toStrictEqual(
      getHandshakeResponse.data.registry_signature
    );
    expect(getUpdatedIdentityResponse.data.identity_signature).toStrictEqual(
      identitySignature
    );
  });
});
