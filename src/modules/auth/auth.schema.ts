import { t } from "elysia";

export const getAuthHandshakeSchema = {
  params: t.Object({
    dctrl: t.String(),
  }),
};
