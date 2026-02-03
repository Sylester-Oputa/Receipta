import { createApp } from "./app";
import { env } from "./config/env";
import { ensureStorageDirs } from "./utils/storage";
import { logger } from "./config/logger";

ensureStorageDirs();

const app = createApp();

app.listen(env.port, () => {
  logger.info(`Receipta API running on port ${env.port}`);
});
