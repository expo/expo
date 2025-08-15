/**
 * Create an event listener for a view modifier.
 */
export function createViewModifierEventListener(modifiers) {
    const eventListeners = {};
    for (const modifier of modifiers) {
        if (modifier.eventListener) {
            eventListeners[modifier.$type] = modifier.eventListener;
        }
    }
    const onGlobalEvent = ({ nativeEvent }) => {
        for (const [eventName, params] of Object.entries(nativeEvent)) {
            const listener = eventListeners[eventName];
            if (listener) {
                listener(params);
            }
        }
    };
    return {
        onGlobalEvent,
    };
}
//# sourceMappingURL=utils.js.map