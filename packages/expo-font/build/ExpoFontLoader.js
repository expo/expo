import { requireNativeModule } from 'expo-modules-core';
const m = typeof window === 'undefined'
    ? // React server mock
        {
            getLoadedFonts() {
                return [];
            },
            loadAsync() { },
        }
    : requireNativeModule('ExpoFontLoader');
export default m;
//# sourceMappingURL=ExpoFontLoader.js.map