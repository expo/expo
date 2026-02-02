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
 * Create an event listener for a view modifier.
 *
 * @param modifiers - An array of modifier configs to extract event listeners from.
 */
export declare function createViewModifierEventListener(modifiers: ModifierConfig[]): GlobalEvent;
//# sourceMappingURL=utils.d.ts.map