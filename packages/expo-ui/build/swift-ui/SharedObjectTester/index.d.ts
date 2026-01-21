import type { DummySharedObject } from '../../DummySharedObject';
import type { NativeStateString } from '../../NativeState';
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
    onValueChange?: (event: {
        counter: number;
    }) => void;
} & CommonViewModifierProps;
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
export declare function SharedObjectTester(props: SharedObjectTesterProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map