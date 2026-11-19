declare module 'react-native/Libraries/Components/TextInput/TextInputState' {
  import type { HostInstance } from 'react-native';

  /**
   * React Native's registry of focusable text inputs. `ScrollView` reads it to
   * decide whether a touch landed on the focused input, and `Keyboard.dismiss()`
   * blurs whatever it points at. `TextInput.State` re-exports only a read-only
   * subset publicly, so participating in the registry requires this module.
   */
  const TextInputState: {
    currentlyFocusedInput(): HostInstance | null;
    /** Marks an instance as focused. Does not dispatch a native focus command. */
    focusInput(instance: HostInstance | null): void;
    /** Clears the focused instance, but only if it is the one passed in. */
    blurInput(instance: HostInstance | null): void;
    registerInput(instance: HostInstance): void;
    unregisterInput(instance: HostInstance): void;
    isTextInput(instance: HostInstance): boolean;
    /** Marks an instance as focused, then dispatches a native `focus` command. */
    focusTextInput(instance: HostInstance | null): void;
    /** Clears the focused instance, then dispatches a native `blur` command. */
    blurTextInput(instance: HostInstance | null): void;
  };

  export default TextInputState;
}
