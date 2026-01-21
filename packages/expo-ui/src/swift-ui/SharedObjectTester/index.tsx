import { requireNativeView } from 'expo';

import type { DummySharedObject } from '../../DummySharedObject';
import type { NativeStateString } from '../../NativeState';
import NativeExpoUIModule from '../../NativeExpoUIModule';
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

// Temporary solution to pass the shared object ID instead of the object.
// We can't really pass it as an object in the old architecture.
function getDummySharedObjectId(
  sharedObject: DummySharedObject | number | undefined
): number | null {
  if (sharedObject instanceof NativeExpoUIModule.DummySharedObject) {
    // @ts-expect-error - __expo_shared_object_id__ is a hidden property
    return sharedObject.__expo_shared_object_id__;
  }
  if (typeof sharedObject === 'number') {
    return sharedObject;
  }
  return null;
}

function getNativeStateStringId(
  state: NativeStateString | number | undefined
): number | null {
  if (state instanceof NativeExpoUIModule.NativeStateString) {
    // @ts-expect-error - __expo_shared_object_id__ is a hidden property
    return state.__expo_shared_object_id__;
  }
  if (typeof state === 'number') {
    return state;
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
  const sharedObjectId = getDummySharedObjectId(sharedObject);
  const textFieldValueId = getNativeStateStringId(textFieldValue);

  return (
    <SharedObjectTesterNativeView
      {...restProps}
      sharedObject={sharedObjectId}
      textFieldValue={textFieldValueId}
      onValueChange={onValueChange ? (e) => onValueChange(e.nativeEvent) : undefined}
    />
  );
}
