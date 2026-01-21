import { requireNativeView, SharedObject } from 'expo';

import type { DummySharedObject } from '../../DummySharedObject';
import type { NativeStateString } from '../../NativeState/NativeStateString';
import { type ViewEvent } from '../../types';
import { type CommonViewModifierProps } from '../types';

export type SharedObjectTesterProps = {
  /**
   * The shared object to display and interact with.
   */
  sharedObject?: DummySharedObject;
  /**
   * A NativeStateString to bind to the TextField.
   */
  textFieldValue?: NativeStateString;
  /**
   * A callback that is called when the counter value changes.
   */
  onValueChange?: (event: { counter: number }) => void;
} & CommonViewModifierProps;

type NativeSharedObjectTesterProps = Omit<
  SharedObjectTesterProps,
  'onValueChange' | 'sharedObject' | 'textFieldValue'
> & {
  sharedObject?: number | null;
  textFieldValue?: number | null;
} & ViewEvent<'onValueChange', { counter: number }>;

const SharedObjectTesterNativeView: React.ComponentType<NativeSharedObjectTesterProps> =
  requireNativeView('ExpoUI', 'SharedObjectTesterView');

/**
 * Extracts the shared object ID from any SharedObject instance.
 * This is needed because the native bridge expects the ID, not the object itself.
 */
function getSharedObjectId<T extends SharedObject<any>>(
  sharedObject: T | undefined
): number | null {
  if (!sharedObject) {
    return null;
  }
  if (typeof sharedObject === 'object' && sharedObject !== null) {
    // @ts-expect-error - __expo_shared_object_id__ is a hidden property on SharedObject instances
    const id = sharedObject.__expo_shared_object_id__;
    if (typeof id === 'number') {
      return id;
    }
  }
  if (typeof sharedObject === 'number') {
    return sharedObject;
  }
  return null;
}

/**
 * A test component that demonstrates passing shared objects as props to SwiftUI views.
 * This component displays the shared object's text and counter, and provides buttons to interact with it.
 * It also includes a TextField that binds to a NativeStateString.
 *
 * @example
 * ```tsx
 * import { SharedObjectTester, useDummySharedObject, useNativeStateString } from '@expo/ui/swift-ui';
 *
 * function MyComponent() {
 *   const sharedObject = useDummySharedObject((obj) => {
 *     obj.text = "Custom text";
 *   });
 *   const textState = useNativeStateString("Initial text");
 *
 *   return (
 *     <SharedObjectTester
 *       sharedObject={sharedObject}
 *       textFieldValue={textState}
 *       onValueChange={(event) => console.log('Counter:', event.counter)}
 *     />
 *   );
 * }
 * ```
 */
export function SharedObjectTester(props: SharedObjectTesterProps) {
  const { sharedObject, textFieldValue, onValueChange, ...restProps } = props;
  const sharedObjectId = getSharedObjectId(sharedObject);
  const textFieldValueId = getSharedObjectId(textFieldValue);

  return (
    <SharedObjectTesterNativeView
      {...restProps}
      sharedObject={sharedObjectId}
      textFieldValue={textFieldValueId}
      onValueChange={onValueChange ? (e) => onValueChange(e.nativeEvent) : undefined}
    />
  );
}
