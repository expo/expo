import * as node_util from 'node:util';

const DEFAULT_SCRIPT_NAME = 'file:///__main.js';

// - ./runtime/importMetaRegistry.ts (this file) -> importMetaRegistry.url
// - ./runtime/index.ts -> globalThis.__ExpoImportMetaRegistry
// - <source>
const CALL_DEPTH = 3;

function getFileName(offset = 0): any {
  const originalStackFormatter = Error.prepareStackTrace;
  const originalStackTraceLimit = Error.stackTraceLimit;
  try {
    Error.stackTraceLimit = offset;
    Error.prepareStackTrace = (_err, stack) => stack[offset - 1]?.getFileName();
    return new Error().stack as any;
  } finally {
    Error.prepareStackTrace = originalStackFormatter;
    Error.stackTraceLimit = originalStackTraceLimit;
  }
}

export const importMetaRegistry = {
  get url() {
    let scriptName: string;
    if (node_util.getCallSites) {
      const callSites = node_util.getCallSites(CALL_DEPTH);
      scriptName = callSites[callSites.length - 1]?.scriptName;
    } else {
      scriptName = getFileName(CALL_DEPTH);
    }
    if (scriptName?.[0] === '/') scriptName = `file://${scriptName}`;
    return scriptName || DEFAULT_SCRIPT_NAME;
  },
};
