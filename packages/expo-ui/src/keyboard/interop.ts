import { TextInput } from 'react-native';

import { TextInputState } from './textInputState';

/**
 * How a `<Host>` acts on the field that holds focus, once React Native asks the
 * host to blur or focus.
 */
export type HostedFocusController = {
  blurFocusedFields: () => void;
  /** Refocuses the field that held focus last, if it is still there. */
  focusLastField: () => void;
};

type FocusEntryPoints = {
  blurTextInput: (instance: any) => void;
  focusTextInput: (instance: any) => void;
};

// Weak so a host that unmounts without detaching cannot keep its instance alive.
const controllers = new WeakMap<object, HostedFocusController>();
let installed = false;

/**
 * Starts routing React Native's blur and focus requests for this host to its
 * hosted fields.
 */
export function attachHostController(instance: object, controller: HostedFocusController) {
  controllers.set(instance, controller);
  install();
}

export function detachHostController(instance: object) {
  controllers.delete(instance);
}

/**
 * React Native blurs the focused input by dispatching a native `blur` view
 * command to it. A hosted SwiftUI or Compose field cannot receive one: it has no
 * host component of its own, so the command would land on the `<Host>` and stop
 * there. Taking over the two entry points instead lets the host forward the
 * request to the field that actually holds focus, through the same imperative
 * methods `ref.blur()` and `ref.focus()` already use.
 *
 * Inputs React Native owns are passed through untouched, and the takeover only
 * happens once a hosted text field exists.
 *
 * Re-evaluating this module, which only Fast Refresh does, adds one more wrapper
 * in front of the previous one. That stays correct: a host this copy does not know
 * falls through to the wrapper before it.
 */
function install() {
  if (installed) {
    return;
  }
  installed = true;
  takeOver(TextInputState);
  // `TextInput.State` holds its own copies of these two functions, so it needs
  // the same treatment to stay consistent with the module it copied them from.
  takeOver(TextInput?.State as unknown as FocusEntryPoints);
}

function takeOver(target: FocusEntryPoints | undefined) {
  // If React Native ever reshapes these, hosted fields quietly stop taking part
  // rather than breaking the app.
  if (typeof target?.blurTextInput !== 'function' || typeof target?.focusTextInput !== 'function') {
    return;
  }

  const blurTextInput = target.blurTextInput;
  const focusTextInput = target.focusTextInput;

  target.blurTextInput = (instance: any) => {
    const controller = instance ? controllers.get(instance) : undefined;
    if (!controller) {
      blurTextInput(instance);
      return;
    }
    TextInputState.blurInput(instance);
    controller.blurFocusedFields();
  };

  target.focusTextInput = (instance: any) => {
    const controller = instance ? controllers.get(instance) : undefined;
    if (!controller) {
      focusTextInput(instance);
      return;
    }
    // No `focusInput` here: the field's own focus event sets the focused instance
    // once focus actually lands, so React Native is never told about focus that
    // did not happen.
    controller.focusLastField();
  };
}
