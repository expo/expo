import { createHash } from 'node:crypto';

export const NATIVE_ADDON_EXPORT_PREFIX = '\0node-addon-export:';

export function getNativeAddonId(filePath: string): string {
  return createHash('sha256').update(filePath).digest('hex');
}

export function createNativeAddonLoader(filenames: Record<string, string>): string {
  return `function __expo_require_native__(id){const filenames=${JSON.stringify(filenames)};return $$require_external($$require_external("node:path").resolve(__dirname,filenames[id]));}\n`;
}
