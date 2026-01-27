import { renderToImageAsync, loadAsync } from 'expo-font';
import { androidSymbolToString } from './android';
import { getFont } from './utils';
/**
 * Renders a Material Symbol to an image source.
 *
 * @platform android
 */
export async function unstable_getMaterialSymbolSourceAsync(symbol, size, color) {
    if (!symbol)
        return null;
    if (typeof renderToImageAsync !== 'function') {
        console.warn(`Font.renderToImageAsync is not available. Please update expo-font.`);
        return null;
    }
    const fontChar = androidSymbolToString(symbol);
    if (!fontChar)
        return null;
    const font = getFont('regular');
    await loadAsync({
        [font.name]: font.font,
    });
    const image = await renderToImageAsync(fontChar, {
        fontFamily: font.name,
        size,
        color,
        lineHeight: size,
    });
    return image;
}
//# sourceMappingURL=materialImageSource.js.map