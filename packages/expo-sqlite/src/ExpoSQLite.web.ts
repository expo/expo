import { requireNativeModule } from 'expo';

let ExpoSQLite;

if (typeof window === 'undefined') {
  throw new Error('expo-sqlite is not supported on server runtime.');
} else if (typeof globalThis.ExpoDomWebView !== 'undefined') {
  ExpoSQLite = requireNativeModule('ExpoSQLite');
} else {
  ExpoSQLite = require('../web/SQLiteModule').default;
}

export default ExpoSQLite;
