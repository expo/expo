import { requireNativeView } from 'expo';

import type { DummySharedObject } from '../../DummySharedObject';
import NativeExpoUIModule from '../../NativeExpoUIModule';
import { type ViewEvent } from '../../types';
import { type CommonViewModifierProps } from '../types';

export type SharedObjectTesterProps = {
  /**
   * The shared object to display and interact with.
   */
  sharedObject?: DummySharedObject;
  /**
   * A callback that is called when the counter value changes.
   */
  onValueChange?: (event: { counter: number }) => void;
} & CommonViewModifierProps;

type NativeSharedObjectTesterProps = Omit<SharedObjectTesterProps, 'onValueChange' | 'sharedObject'> & {
  sharedObject?: number | null;
} & ViewEvent<'onValueChange', { counter: number }>;

const SharedObjectTesterNativeView: React.ComponentType<NativeSharedObjectTesterProps> =
  requireNativeView('ExpoUI', 'SharedObjectTesterView');

/**
 * Extracts the shared object ID from a DummySharedObject instance.
 * This is needed because the native bridge expects the ID, not the object itself.
 */
function getSharedObjectId(sharedObject: DummySharedObject | undefined): number | null {
  if (!sharedObject) {
    return null;
  }
  if (sharedObject instanceof NativeExpoUIModule.DummySharedObject) {
    // @ts-expect-error - __expo_shared_object_id__ is a hidden property on SharedObject instances
    return sharedObject.__expo_shared_object_id__;
  }
  if (typeof sharedObject === 'number') {
    return sharedObject;
  }
  return null;
}

/**
 * A test component that demonstrates passing shared objects as props to SwiftUI views.
 * This component displays the shared object's text and counter, and provides buttons to interact with it.
 *
 * @example
 * ```tsx
 * import { SharedObjectTester, useDummySharedObject } from '@expo/ui/swift-ui';
 *
 * function MyComponent() {
 *   const sharedObject = useDummySharedObject((obj) => {
 *     obj.text = "Custom text";
 *   });
 *
 *   return (
 *     <SharedObjectTester
 *       sharedObject={sharedObject}
 *       onValueChange={(event) => console.log('Counter:', event.counter)}
 *     />
 *   );
 * }
 * ```
 */
export function SharedObjectTester(props: SharedObjectTesterProps) {
  const { sharedObject, onValueChange, ...restProps } = props;
  const sharedObjectId = getSharedObjectId(sharedObject);

  return (
    <SharedObjectTesterNativeView
      {...restProps}
      sharedObject={sharedObjectId}
      onValueChange={onValueChange ? (e) => onValueChange(e.nativeEvent) : undefined}
    />
  );
}
