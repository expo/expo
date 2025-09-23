import { getCallSites } from 'node:util';

const DEFAULT_SCRIPT_NAME = 'file:///__main.js';

// - ./runtime/importMetaRegistry.ts (this file) -> importMetaRegistry.url
// - ./runtime/index.ts -> globalThis.__ExpoImportMetaRegistry
// - <source>
const CALL_DEPTH = 3;

export const importMetaRegistry = {
  get url() {
    const callSites = getCallSites(CALL_DEPTH);
    let scriptName = callSites[callSites.length - 1]?.scriptName;
    if (scriptName?.[0] === '/') scriptName = `file://${scriptName}`;
    return scriptName || DEFAULT_SCRIPT_NAME;
  },
};
