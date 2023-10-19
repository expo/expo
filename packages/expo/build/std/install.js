import { polyfillGlobal } from 'react-native/Libraries/Utilities/PolyfillFunctions';
polyfillGlobal('URL', () => require('./url').URL);
polyfillGlobal('URLSearchParams', () => require('./url').URLSearchParams);
//# sourceMappingURL=install.js.map