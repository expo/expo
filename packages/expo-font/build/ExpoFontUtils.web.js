import { NativeModule, registerWebModule, UnavailabilityError } from 'expo-modules-core';
class ExpoFontUtils extends NativeModule {
    async renderToImageAsync(glyphs, options) {
        throw new UnavailabilityError('expo-font', 'renderToImageAsync');
    }
}
export default registerWebModule(ExpoFontUtils, 'ExpoFontUtils');
//# sourceMappingURL=ExpoFontUtils.web.js.map