import { type Ref, type RefObject } from 'react';
import type { ReactNativeElement } from 'react-native';
/** The wrapper component that `requireNativeView` returns. */
type NativeViewWrapper = {
    getNativeRef?: () => ReactNativeElement | null;
};
/** The subset of a field's imperative handle a host needs. */
type TextInputHandle = {
    focus: () => unknown;
    blur: () => unknown;
};
/** Used by `<Host>`. Attach the returned ref to the native host view. */
export declare function useTextInputHostRef(): RefObject<NativeViewWrapper | null>;
/**
 * Lends the host's native view to the fields it hosts, at any depth.
 *
 * A field inside a nested host uses the inner one, which is also what the hit
 * test reports. Presented content is the exception: a field inside a `BottomSheet`
 * or `Popover` is nested in the React tree but not in the host's view, so it
 * registers a view the touch never lands on.
 */
export declare function TextInputHostProvider({ hostRef, children, }: {
    hostRef: RefObject<NativeViewWrapper | null>;
    children: React.ReactNode;
}): import("react/jsx-runtime").JSX.Element;
/**
 * Used by hosted text fields. Joins React Native's keyboard coordination through
 * the surrounding host, and returns the ref to attach to the native view plus
 * the focus handler to wire to its focus event. The app's own ref and callback
 * keep working.
 */
export declare function useHostedTextInput<T extends TextInputHandle>(ref: Ref<T> | undefined, onFocusChange: ((focused: boolean) => void) | undefined): {
    ref: (instance: T | null) => void;
    onFocusChange: (focused: boolean) => void;
};
export {};
//# sourceMappingURL=index.d.ts.map