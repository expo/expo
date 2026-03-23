// @ts-expect-error importing private module
import ReactNativeStyleAttributes from 'react-native/Libraries/Components/View/ReactNativeStyleAttributes';

export function processFonts(
  fontFamilies: (string | undefined)[]
): (string | undefined)[] {
  const fontFamilyProcessor = ReactNativeStyleAttributes.fontFamily?.process;
  if (typeof fontFamilyProcessor === 'function') {
    return fontFamilies.map(fontFamilyProcessor);
  }
  return fontFamilies;
}
