import { requireNativeModule } from 'expo';

let ExpoSQLite;

if (typeof window === 'undefined') {
  // expo-sqlite is not supported on server runtime.
  ExpoSQLite = {};
} else if (typeof globalThis.ExpoDomWebView !== 'undefined') {
  ExpoSQLite = requireNativeModule('ExpoSQLite');
} else {
  ExpoSQLite = require('../web/SQLiteModule').default;
}

export default ExpoSQLite;
