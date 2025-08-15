import { requireNativeModule } from 'expo-modules-core';
const m = typeof window === 'undefined'
    ? // React server mock
        {
            getLoadedFonts() {
                return [];
            },
            loadAsync() {
                return Promise.resolve();
            },
        }
    : requireNativeModule('ExpoFontLoader');
export default m;
//# sourceMappingURL=ExpoFontLoader.js.map