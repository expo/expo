import { ParamListBase, StackNavigationState } from '@react-navigation/native';
import { ExtendedStackNavigationOptions } from '../../layouts/StackClient';
/**
 * A minimal subset of `ExtendedStackNavigationOptions` needed for the helper
 * @internal
 */
export type PresentationOptions = Partial<Pick<ExtendedStackNavigationOptions, 'presentation'>>;
/**
 * Helper to determine if a given screen should be treated as a modal-type presentation
 *
 * @param options - The navigation options.
 * @returns Whether the screen should be treated as a modal-type presentation.
 *
 * @internal
 */
export declare function isModalPresentation(options?: PresentationOptions | null): boolean;
/**
 * Helper to determine if a given screen should be treated as a transparent modal-type presentation
 *
 * @param options - The navigation options.
 * @returns Whether the screen should be treated as a transparent modal-type presentation.
 *
 * @internal
 */
export declare function isTransparentModalPresentation(options?: PresentationOptions | null): boolean;
/**
 * SSR-safe viewport detection: initial render always returns `false` so that
 * server and client markup match. The actual media query evaluation happens
 * after mount.
 *
 * @internal
 */
export declare function useIsDesktop(breakpoint?: number): boolean;
/**
 * Returns a copy of the given Stack navigation state with any modal-type routes removed
 * (only when running on the web) and a recalculated `index` that still points at the
 * currently active non-modal route. If the active route *is* a modal that gets
 * filtered out, we fall back to the last remaining route – this matches the logic
 * used inside `ModalStackView` so that the underlying `NativeStackView` never tries
 * to render a modal screen that is simultaneously being shown in the overlay.
 *
 * This helper is exported primarily for unit-testing; it should be considered
 * internal to `ModalStack.web` and not a public API.
 *
 * @param state - The navigation state.
 * @param descriptors - The navigation descriptors.
 * @param isWeb - Whether the current platform is web.
 * @returns The navigation state with any modal-type routes removed.
 *
 * @internal
 */
export declare function convertStackStateToNonModalState(state: StackNavigationState<ParamListBase>, descriptors: Record<string, {
    options: ExtendedStackNavigationOptions;
}>, isWeb: boolean): {
    routes: import("@react-navigation/native").NavigationRoute<ParamListBase, string>[];
    index: number;
};
/**
 * Returns the index of the last route in the stack that is *not* a modal.
 *
 * @param state - The navigation state.
 * @param descriptors - The navigation descriptors.
 * @returns The index of the last non-modal route.
 *
 * @internal
 */
export declare function findLastNonModalIndex(state: StackNavigationState<ParamListBase>, descriptors: Record<string, {
    options: ExtendedStackNavigationOptions;
}>): number;
//# sourceMappingURL=utils.d.ts.map