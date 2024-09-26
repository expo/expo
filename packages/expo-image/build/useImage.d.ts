import { DependencyList } from 'react';
import type { ImageRef, ImageSource, UseImageHookOptions } from './Image.types';
/**
 * A hook that loads an image from the given source and returns a reference
 * to the native image instance, or `null` until the first image is successfully loaded.
 *
 * It loads a new image every time the `uri` of the provided source changes.
 * To trigger reloads in some other scenarios, you can provide an additional dependency list.
 * @platform android
 * @platform ios
 * @platform web
 */
export declare function useImage(source: ImageSource | string, options?: UseImageHookOptions, dependencies?: DependencyList): ImageRef | null;
//# sourceMappingURL=useImage.d.ts.map