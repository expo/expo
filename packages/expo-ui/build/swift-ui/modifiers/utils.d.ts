import { type ModifierConfig } from './createModifier';
export type GlobalEventPayload = {
    [eventName: string]: Record<string, any>;
};
export type GlobalEvent = {
    onGlobalEvent: (event: {
        nativeEvent: GlobalEventPayload;
    }) => void;
};
/**
 * Creates an event listener that routes native events to modifier event handlers.
 *
 * @param modifiers - An array of modifier configs to extract event listeners from.
 */
export declare function createViewModifierEventListener(modifiers: ModifierConfig[]): GlobalEvent;
//# sourceMappingURL=utils.d.ts.map