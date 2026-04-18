// @ts-expect-error importing private module
import ReactNativeStyleAttributes from 'react-native/Libraries/Components/View/ReactNativeStyleAttributes';
export function processFonts(fontFamilies) {
    const fontFamilyProcessor = ReactNativeStyleAttributes.fontFamily?.process;
    if (typeof fontFamilyProcessor === 'function') {
        return fontFamilies.map(fontFamilyProcessor);
    }
    return fontFamilies;
}
//# sourceMappingURL=FontProcessor.native.js.map