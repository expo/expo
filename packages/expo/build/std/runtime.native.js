// This file configures the runtime environment to increase compatibility with WinterCG.
// https://wintercg.org/
import { polyfillGlobal } from 'react-native/Libraries/Utilities/PolyfillFunctions';
// https://url.spec.whatwg.org/#url
polyfillGlobal('URL', () => require('./url').URL);
// https://url.spec.whatwg.org/#urlsearchparams
polyfillGlobal('URLSearchParams', () => require('./url').URLSearchParams);
//# sourceMappingURL=runtime.native.js.map