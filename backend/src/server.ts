import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";

const app = createApp();

app.listen(env.port, () => {
  logger.info(`Receipta API running on port ${env.port}`);
});
