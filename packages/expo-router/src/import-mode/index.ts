export type ImportMode = 'sync' | 'lazy';

export default (process.env.EXPO_ROUTER_IMPORT_MODE || 'sync') as ImportMode;
