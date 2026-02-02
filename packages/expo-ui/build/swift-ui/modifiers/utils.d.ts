import { type ModifierConfig } from './createModifier';
type GlobalEventPayload = {
    [eventName: string]: Record<string, any>;
};
type GlobalEvent = {
    onGlobalEvent: (event: {
        nativeEvent: GlobalEventPayload;
    }) => void;
};
/**
 * Creates an event listener that routes native global events to the appropriate modifier event handlers.
 * This is used internally by Expo UI components to connect native SwiftUI modifier events to JavaScript callbacks,
 * and can be used by 3rd party libraries when building custom components that support modifiers.
 *
 * @param modifiers - An array of `ModifierConfig` objects, some of which may have `eventListener` callbacks.
 * @returns An object with an `onGlobalEvent` handler that dispatches events to the correct modifier listener.
 *
 * @example
 * ```tsx
 * import { createViewModifierEventListener } from '@expo/ui/swift-ui/modifiers';
 *
 * function MyComponent({ modifiers, ...props }) {
 *   return (
 *     <MyNativeView
 *       {...props}
 *       modifiers={modifiers}
 *       {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
 *     />
 *   );
 * }
 * ```
 */
export declare function createViewModifierEventListener(modifiers: ModifierConfig[]): GlobalEvent;
export {};
//# sourceMappingURL=utils.d.ts.map