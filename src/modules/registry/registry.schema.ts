import { t } from "elysia";

export const getIdentityRequestSchema = {
  params: t.Object({
    dctrl: t.String(),
  }),
};

export const registerIdentityRequestSchema = {
  params: t.Object({
    dctrl: t.String(),
  }),
  body: t.Object({
    registry_signature: t.String(),
    identity_signature: t.String(),
    data_signature: t.String(),
    handshake_key: t.String(),
    data: t.Object({
      alias: t.String(),
      mediator_addr: t.Array(t.String()),
    }),
  }),
};
