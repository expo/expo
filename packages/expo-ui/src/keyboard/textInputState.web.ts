import type TextInputStateType from 'react-native/Libraries/Components/TextInput/TextInputState';

// The browser tracks the focused element itself, so there is nothing to coordinate on web.
const TextInputState: typeof TextInputStateType = {
  currentlyFocusedInput: () => null,
  focusInput: () => {},
  blurInput: () => {},
  registerInput: () => {},
  unregisterInput: () => {},
  isTextInput: () => false,
};

export default TextInputState;
