/**
 * A stand-in for React Native's `TextInputState` with the same bookkeeping and
 * the same guards: `focusInput` ignores null, and `blurInput` clears the focused
 * instance only when it is the one passed in. The hosted-field registry relies on
 * both, so a looser fake would hide real ordering bugs.
 *
 * `focusTextInput` and `blurTextInput` are the two entry points `keyboard/interop`
 * takes over, so they are spies: a call that reaches them is a call that was
 * passed through to React Native instead of being routed to a host.
 */

/** Stands in for a native host component. */
type Instance = object;

let focusedInput: Instance | null = null;
const inputs = new Set<Instance>();

export const passedThroughFocusTextInput = jest.fn((instance: Instance | null) => {
  if (instance != null) {
    focusedInput = instance;
  }
});

export const passedThroughBlurTextInput = jest.fn((instance: Instance | null) => {
  if (instance != null && focusedInput === instance) {
    focusedInput = null;
  }
});

export const TextInputState = {
  currentlyFocusedInput: () => focusedInput,
  focusInput: (instance: Instance | null) => {
    if (instance != null) {
      focusedInput = instance;
    }
  },
  blurInput: (instance: Instance | null) => {
    if (instance != null && focusedInput === instance) {
      focusedInput = null;
    }
  },
  registerInput: (instance: Instance) => {
    inputs.add(instance);
  },
  unregisterInput: (instance: Instance) => {
    inputs.delete(instance);
  },
  isTextInput: (instance: Instance) => inputs.has(instance),
  focusTextInput: passedThroughFocusTextInput,
  blurTextInput: passedThroughBlurTextInput,
};

export function resetFakeTextInputState() {
  focusedInput = null;
  inputs.clear();
}
