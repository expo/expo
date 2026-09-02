import { Platform } from 'react-native';

// Default to true on other platforms than web (native, SSR) so any focus
// event registers as keyboard-driven there. On web, a pointer event flips this
// to false before the focus event fires.
let lastInputWasKeyboard = Platform.OS !== 'web';

export const wasLastInputKeyboard = () => lastInputWasKeyboard;

if (Platform.OS === 'web' && typeof window !== 'undefined') {
  window.addEventListener(
    'keydown',
    (event) => {
      if (!event.altKey && !event.ctrlKey && !event.metaKey) {
        lastInputWasKeyboard = true;
      }
    },
    true
  );

  const listener = () => {
    lastInputWasKeyboard = false;
  };

  window.addEventListener('mousedown', listener, true);
  window.addEventListener('pointerdown', listener, true);
  window.addEventListener('touchstart', listener, true);
}
