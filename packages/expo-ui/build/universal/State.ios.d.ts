export { useNativeState } from '@expo/ui/swift-ui';
/**
 * Universal observable state shape. On iOS this is satisfied by the native
 * SwiftUI `ObservableState` shared object — typing updates `.value`
 * synchronously on the UI thread.
 */
export type ObservableState<T> = {
    value: T;
};
//# sourceMappingURL=State.ios.d.ts.map