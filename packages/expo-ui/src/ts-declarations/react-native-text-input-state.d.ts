declare module 'react-native/Libraries/Components/TextInput/TextInputState' {
  import type { ReactNativeElement } from 'react-native';

  /**
   * React Native's registry of focusable text inputs. `ScrollView` reads it to
   * decide whether a touch landed on the focused input, and `Keyboard.dismiss()`
   * blurs whatever it points at. `TextInput.State` re-exports only a read-only
   * subset publicly, so participating in the registry requires this module.
   */
  const TextInputState: {
    currentlyFocusedInput(): ReactNativeElement | null;
    /** Marks an instance as focused. Does not dispatch a native focus command. */
    focusInput(instance: ReactNativeElement | null): void;
    /** Clears the focused instance, but only if it is the one passed in. */
    blurInput(instance: ReactNativeElement | null): void;
    registerInput(instance: ReactNativeElement): void;
    unregisterInput(instance: ReactNativeElement): void;
    isTextInput(instance: ReactNativeElement): boolean;
    /** Marks an instance as focused, then dispatches a native `focus` command. */
    focusTextInput(instance: ReactNativeElement | null): void;
    /** Clears the focused instance, then dispatches a native `blur` command. */
    blurTextInput(instance: ReactNativeElement | null): void;
  };

  export default TextInputState;
}

declare module 'react-native/Libraries/Utilities/useMergeRefs' {
  import type { Ref } from 'react';

  /**
   * Forwards a value to each of the given refs, handling both object refs and
   * callback refs, including a callback ref's cleanup function.
   */
  export default function useMergeRefs<T>(
    ...refs: (Ref<T> | null | undefined)[]
  ): (instance: T | null) => void;
}
