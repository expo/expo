import { type ModifierConfig } from './createModifier';

export type GlobalEventPayload = {
  [eventName: string]: Record<string, any>;
};
export type GlobalEvent = {
  onGlobalEvent: (event: { nativeEvent: GlobalEventPayload }) => void;
};

/**
 * Create an event listener for a view modifier.
 *
 * @param modifiers - An array of modifier configs to extract event listeners from.
 */
export function createViewModifierEventListener(modifiers: ModifierConfig[]): GlobalEvent {
  const eventListeners: Record<string, (args: any) => void> = {};
  for (const modifier of modifiers) {
    if (modifier.eventListener) {
      eventListeners[modifier.$type] = modifier.eventListener;
    }
  }

  const onGlobalEvent: GlobalEvent['onGlobalEvent'] = ({ nativeEvent }) => {
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
