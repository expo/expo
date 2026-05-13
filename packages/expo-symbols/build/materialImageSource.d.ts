import type { ImageSourcePropType } from 'react-native';
import { type AndroidSymbol } from './android';
/**
 * Renders a Material Symbol to an image source. Useful for APIs that require an `ImageSourcePropType` instead of a component, such as tab bar icons.
 *
 * @platform android
 */
export declare function unstable_getMaterialSymbolSourceAsync(symbol: AndroidSymbol | null, size: number, color: string): Promise<ImageSourcePropType | null>;
//# sourceMappingURL=materialImageSource.d.ts.map