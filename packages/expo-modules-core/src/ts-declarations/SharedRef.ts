import type { EventsMap } from './EventEmitter';
import type { SharedObject } from './SharedObject';

/**
 * A {@link SharedObject} that holds a reference to any native object. Allows passing references
 * to native instances among different independent libraries.
 *
 * For instance, `ImageRef` from `expo-image` references a [Drawable](https://developer.android.com/reference/android/graphics/drawable/Drawable)
 * on Android and an [UIImage](https://developer.apple.com/documentation/uikit/uiimage) on iOS. Since both types are common on these platforms,
 * different native modules can use them without depending on each other. In particular, this enables the `expo-image-manipulator` to pass the resulted image
 * directly to the image view from `expo-image` without any additional writes and reads from the file system.
 */
export declare class SharedRef<
    TNativeRefType extends string = 'unknown',
    TEventsMap extends EventsMap = Record<never, never>,
  >
  extends SharedObject<TEventsMap>
  implements SharedObject<TEventsMap>
{
  /**
   * A dummy private property with the given generic type. It is required for TypeScript to correctly infer this subtype.
   * @private
   * @deprecated
   */
  _TNativeRefType_DONT_USE_IT?: TNativeRefType;

  /**
   * The type of the native reference.
   */
  nativeRefType: string;
}
