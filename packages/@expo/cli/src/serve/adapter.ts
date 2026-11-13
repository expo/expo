import JsonFile from '@expo/json-file';
import { loadModuleSync } from '@expo/require-utils';
import { createEnvironment } from 'expo-server/adapter/environment/common';
import { createRequestHandler as createHttpHandler } from 'expo-server/adapter/http';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export function createRequestHandler(params: { build: string }) {
  const environment = createEnvironment({
    async readText(request) {
      try {
        return await fs.promises.readFile(path.join(params.build, request), 'utf8');
      } catch {
        return null;
      }
    },
    async readJson(request) {
      return JsonFile.readAsync(path.join(params.build, request));
    },
    async loadModule(request) {
      const filePath = path.join(params.build, request);
      if (/\.c?js$/.test(filePath)) {
        return loadModuleSync(filePath);
      }
      const importFilename = path.isAbsolute(filePath) ? pathToFileURL(filePath).href : filePath;
      return await import(importFilename);
    },
    isDevelopment: false,
  });
  return createHttpHandler(params, environment);
}
