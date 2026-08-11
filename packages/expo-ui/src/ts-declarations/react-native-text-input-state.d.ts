declare module 'react-native/Libraries/Components/TextInput/TextInputState' {
  import type { HostInstance } from 'react-native';

  /**
   * React Native's registry of mounted text inputs and of the currently focused one.
   * `ScrollView` reads it to decide whether a touch should dismiss the keyboard, and
   * `Keyboard.dismiss()` blurs through it. It is not part of React Native's public API and
   * `TextInput.State` exposes only a subset of it, without `registerInput`.
   */
  const TextInputState: {
    currentlyFocusedInput(): HostInstance | null;
    focusInput(textField: HostInstance | null): void;
    blurInput(textField: HostInstance | null): void;
    registerInput(textField: HostInstance): void;
    unregisterInput(textField: HostInstance): void;
    isTextInput(textField: HostInstance): boolean;
  };

  export default TextInputState;
}
