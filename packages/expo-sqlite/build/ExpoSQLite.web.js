import { requireNativeModule } from 'expo';
let ExpoSQLite;
if (typeof window === 'undefined') {
    ExpoSQLite = require('../web/SQLiteModule.node').default;
}
else if (typeof globalThis.ExpoDomWebView !== 'undefined') {
    ExpoSQLite = requireNativeModule('ExpoSQLite');
}
else {
    ExpoSQLite = require('../web/SQLiteModule').default;
}
export default ExpoSQLite;
//# sourceMappingURL=ExpoSQLite.web.js.map