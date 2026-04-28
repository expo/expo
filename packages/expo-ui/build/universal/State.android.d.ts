export { useNativeState } from '@expo/ui/jetpack-compose';
/**
 * Universal observable state shape. On Android this is satisfied by the
 * native Jetpack Compose `ObservableState` shared object — typing updates
 * `.value` synchronously on the UI thread.
 */
export type ObservableState<T> = {
    value: T;
};
//# sourceMappingURL=State.android.d.ts.map