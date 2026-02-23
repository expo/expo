#!/usr/bin/env bun

import { createUploadServer, UPLOAD_SERVER_PORT } from './lib/e2e-common';

const server = createUploadServer();
server.listen(UPLOAD_SERVER_PORT, () => {
  console.log(`Upload server listening on http://localhost:${UPLOAD_SERVER_PORT}`);
});
