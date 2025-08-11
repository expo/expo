import { type ModifierConfig } from './index';

type GlobalEventPayload = {
  [eventName: string]: Record<string, any>;
};
type GlobalEvent = {
  onGlobalEvent: (event: { nativeEvent: GlobalEventPayload }) => void;
  animatedValue: Record<string, any>;
};

/**
 * Create an event listener for a view modifier.
 */
export function createViewModifierEventListener(modifiers: ModifierConfig[]): GlobalEvent {
  const eventListeners: Record<string, (args: any) => void> = {};
  let animatedValue: Record<string, any> = {};
  for (const modifier of modifiers) {
    if (modifier.eventListener) {
      eventListeners[modifier.$type] = modifier.eventListener;
    }
    if (modifier.$type === 'animation') {
      animatedValue = modifier.value;
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
    animatedValue,
  };
}
