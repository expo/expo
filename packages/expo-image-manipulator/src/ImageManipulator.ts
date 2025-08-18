import { useReleasingSharedObject } from 'expo-modules-core';
import { SharedRef } from 'expo-modules-core/types';

import { Action, ImageResult, SaveFormat, SaveOptions } from './ImageManipulator.types';
import { ImageManipulatorContext } from './ImageManipulatorContext';
import ExpoImageManipulator from './NativeImageManipulatorModule';
import { validateArguments } from './validators';

// @needsAudit
/**
 * Manipulate the image provided via `uri`. Available modifications are rotating, flipping (mirroring),
 * resizing and cropping. Each invocation results in a new file. With one invocation you can provide
 * a set of actions to perform over the image. Overwriting the source file would not have an effect
 * in displaying the result as images are cached.
 * @param uri URI of the file to manipulate. Should be on the local file system or a base64 data URI.
 * @param actions An array of objects representing manipulation options. Each object should have
 * __only one__ of the keys that corresponds to specific transformation.
 * @param saveOptions A map defining how modified image should be saved.
 * @return Promise which fulfils with [`ImageResult`](#imageresult) object.
 * @deprecated It has been replaced by the new, contextual and object-oriented API.
 * Use [`ImageManipulator.manipulate`](#manipulatesource) or [`useImageManipulator`](#useimagemanipulatorsource) instead.
 */
export async function manipulateAsync(
  uri: string,
  actions: Action[] = [],
  saveOptions: SaveOptions = {}
): Promise<ImageResult> {
  validateArguments(uri, actions, saveOptions);

  const { format = SaveFormat.JPEG, ...rest } = saveOptions;
  const context = ExpoImageManipulator.manipulate(uri);

  for (const action of actions) {
    if ('resize' in action) {
      context.resize(action.resize);
    } else if ('rotate' in action) {
      context.rotate(action.rotate);
    } else if ('flip' in action) {
      context.flip(action.flip);
    } else if ('crop' in action) {
      context.crop(action.crop);
    } else if ('extent' in action && context.extent) {
      context.extent(action.extent);
    }
  }
  const image = await context.renderAsync();
  const result = await image.saveAsync({ format, ...rest });

  // These shared objects will not be used anymore, so free up some memory.
  context.release();
  image.release();

  return result;
}

export function useImageManipulator(source: string | SharedRef<'image'>): ImageManipulatorContext {
  return useReleasingSharedObject(() => ExpoImageManipulator.manipulate(source), [source]);
}

export { ExpoImageManipulator as ImageManipulator };
