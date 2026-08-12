// React Native for web has no `TextInputState`: the browser owns focus.
export const TextInputState = {
  currentlyFocusedInput: () => null,
  focusInput: () => {},
  blurInput: () => {},
  registerInput: () => {},
  unregisterInput: () => {},
  isTextInput: () => false,
  focusTextInput: () => {},
  blurTextInput: () => {},
};
