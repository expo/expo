import type { DummySharedObject } from '../../DummySharedObject';
import { type CommonViewModifierProps } from '../types';
export type SharedObjectTesterProps = {
    /**
     * The shared object to display and interact with.
     */
    sharedObject?: DummySharedObject;
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
export declare function SharedObjectTester(props: SharedObjectTesterProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map