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
 * Create an event listener for a view modifier.
 */
export declare function createViewModifierEventListener(modifiers: ModifierConfig[]): GlobalEvent;
export {};
//# sourceMappingURL=utils.d.ts.map