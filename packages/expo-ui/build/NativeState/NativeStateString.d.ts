import { SharedObject } from 'expo-modules-core';
/**
 * A shared object that wraps a single observable String value.
 * Can be used to create two-way bindings between JavaScript and SwiftUI views like TextField.
 *
 * When the `value` property is modified from either JS or native, SwiftUI views
 * observing this object will automatically re-render.
 */
export declare class NativeStateString extends SharedObject<{}> {
    /**
     * The string value.
     */
    value: string;
}
/**
 * Creates a direct instance of `NativeStateString` that doesn't release automatically.
 * @param initialValue - Optional initial value for the string state.
 */
export declare function createNativeStateString(initialValue?: string): NativeStateString;
/**
 * Creates a `NativeStateString` which will be automatically cleaned up when the component is unmounted.
 * This is the recommended way to use NativeStateString in React components.
 *
 * @param initialValue - Optional initial value for the string state.
 *
 * @example
 * ```tsx
 * import { useNativeStateString } from '@expo/ui/swift-ui';
 *
 * function MyComponent() {
 *   const textState = useNativeStateString("Hello");
 *
 *   return (
 *     <TextField state={textState} />
 *   );
 * }
 * ```
 */
export declare function useNativeStateString(initialValue?: string): NativeStateString;
//# sourceMappingURL=NativeStateString.d.ts.map