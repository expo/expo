import fs from 'node:fs';
import path from 'node:path';

import { createEnvironment } from './common';

interface NodeEnvParams {
  build: string;
}

export function createNodeEnv(params: NodeEnvParams) {
  async function readText(request: string) {
    const filePath = path.join(params.build, request);
    if (!fs.existsSync(filePath)) {
      return null;
    }
    try {
      return await fs.promises.readFile(filePath, 'utf-8');
    } catch {
      return null;
    }
  }

  async function readJson(request: string) {
    const json = await readText(request);
    return json != null ? JSON.parse(json) : null;
  }

  async function loadModule(request: string) {
    const filePath = path.join(params.build, request);
    if (!fs.existsSync(filePath)) {
      return null;
    } else if (/\.c?js$/.test(filePath)) {
      return require(filePath);
    } else {
      return await import(filePath);
    }
  }

  return createEnvironment({
    readText,
    readJson,
    loadModule,
  });
}
