import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  type Ref,
  type RefObject,
} from 'react';
import type { ReactNativeElement } from 'react-native';

import { attachHostController, detachHostController } from './interop';
import { TextInputState } from './textInputState';
import { useMergeRefs } from '../utils/useMergeRefs';

/**
 * React Native decides whether a touch dismissed the keyboard by comparing the
 * focused instance in `TextInputState` against the `event.target` of the touch.
 * A hosted field can never be that target — SwiftUI children are virtual and
 * Compose children carry no React tag — so every touch inside a host resolves to
 * the host, and the host is what React Native has to be told about.
 *
 * Fields drive all of it. The host only lends its native view as the address.
 */

/** A hosted field, identified by object identity and able to act on itself. */
type HostedField = {
  focus: () => void;
  blur: () => void;
};

/** One host's fields: which are mounted, which report focus. */
type HostEntry = {
  mounted: Set<HostedField>;
  focused: Set<HostedField>;
  lastFocused: HostedField | null;
};

/** The wrapper component that `requireNativeView` returns. */
type NativeViewWrapper = {
  getNativeRef?: () => ReactNativeElement | null;
};

/** The subset of a field's imperative handle a host needs. */
type TextInputHandle = {
  focus: () => unknown;
  blur: () => unknown;
};

// Weak so a host whose fields never unregister cannot outlive its view tree.
// Entries are still removed explicitly, since unregistering from React Native
// matters for correctness, not only for memory.
const hosts = new WeakMap<ReactNativeElement, HostEntry>();

const HostInstanceContext = createContext<RefObject<NativeViewWrapper | null> | null>(null);

/** Used by `<Host>`. Attach the returned ref to the native host view. */
export function useTextInputHostRef() {
  return useRef<NativeViewWrapper | null>(null);
}

/**
 * Lends the host's native view to the fields it hosts, at any depth.
 *
 * A field inside a nested host uses the inner one, which is also what the hit
 * test reports. Presented content is the exception: a field inside a `BottomSheet`
 * or `Popover` is nested in the React tree but not in the host's view, so it
 * registers a view the touch never lands on.
 */
export function TextInputHostProvider({
  hostRef,
  children,
}: {
  hostRef: RefObject<NativeViewWrapper | null>;
  children: React.ReactNode;
}) {
  return <HostInstanceContext.Provider value={hostRef}>{children}</HostInstanceContext.Provider>;
}

function addField(instance: ReactNativeElement, field: HostedField) {
  let entry = hosts.get(instance);
  if (!entry) {
    entry = { mounted: new Set(), focused: new Set(), lastFocused: null };
    hosts.set(instance, entry);
    TextInputState.registerInput(instance);
    const hostEntry = entry;
    attachHostController(instance, {
      blurFocusedFields: () => hostEntry.focused.forEach((focusedField) => focusedField.blur()),
      focusLastField: () => hostEntry.lastFocused?.focus(),
    });
  }
  entry.mounted.add(field);
}

function removeField(instance: ReactNativeElement, field: HostedField) {
  const entry = hosts.get(instance);
  if (!entry) {
    return;
  }
  entry.mounted.delete(field);
  if (entry.lastFocused === field) {
    entry.lastFocused = null;
  }
  // A field can unmount while it still holds focus.
  if (entry.focused.delete(field) && entry.focused.size === 0) {
    TextInputState.blurInput(instance);
  }
  if (entry.mounted.size === 0) {
    // Leaving a stale focused instance behind makes `ScrollView` swallow the
    // first tap of every gesture. `blurInput` no-ops unless it still points here.
    TextInputState.blurInput(instance);
    TextInputState.unregisterInput(instance);
    detachHostController(instance);
    hosts.delete(instance);
  }
}

function setFieldFocused(instance: ReactNativeElement, field: HostedField, focused: boolean) {
  const entry = hosts.get(instance);
  if (!entry) {
    return;
  }
  if (focused) {
    entry.focused.add(field);
    entry.lastFocused = field;
  } else {
    entry.focused.delete(field);
  }
  // Two fields swapping focus emit independent events that can arrive in either
  // order, so the host stays focused while any of its fields is.
  if (entry.focused.size > 0) {
    TextInputState.focusInput(instance);
  } else {
    TextInputState.blurInput(instance);
  }
}

/**
 * Used by hosted text fields. Joins React Native's keyboard coordination through
 * the surrounding host, and returns the ref to attach to the native view plus
 * the focus handler to wire to its focus event. The app's own ref and callback
 * keep working.
 */
export function useHostedTextInput<T extends TextInputHandle>(
  ref: Ref<T> | undefined,
  onFocusChange: ((focused: boolean) => void) | undefined,
  options?: {
    /**
     * Blur the field when it unmounts. SwiftUI only: `blur` there affects just this field, while
     * the Compose handler clears focus for whichever component currently holds it in the host.
     */
    blurOnUnmount?: boolean;
  }
) {
  const hostRef = useContext(HostInstanceContext);
  const nativeRef = useRef<T | null>(null);
  const hostInstance = useRef<ReactNativeElement | null>(null);
  // An `autoFocus` field can report focus before its registration effect runs.
  const focusBeforeRegistered = useRef<boolean | null>(null);
  // Last focus state this field reported, so unmount only blurs a field that holds focus.
  const isFocused = useRef(false);

  // Identifies this field to its host, and lets the host act on it.
  const field = useMemo<HostedField>(
    () => ({
      focus: () => callHandle(nativeRef.current, 'focus'),
      blur: () => callHandle(nativeRef.current, 'blur'),
    }),
    []
  );

  // Blur before React removes the field's native views: a field left first responder while its
  // row is deleted makes UIKit assert ("refused to resign"), and every native teardown hook runs
  // too late to clear SwiftUI's `@FocusState`. https://github.com/expo/expo/issues/49348
  const blurOnUnmount = options?.blurOnUnmount ?? false;
  useLayoutEffect(() => {
    if (!blurOnUnmount) {
      return;
    }
    return () => {
      if (isFocused.current) {
        callHandle(nativeRef.current, 'blur');
      }
    };
  }, [blurOnUnmount]);

  useEffect(() => {
    // Resolved here rather than during render: the host's ref is attached by the
    // time a hosted field's effects run.
    const instance = hostRef?.current?.getNativeRef?.() ?? null;
    hostInstance.current = instance;
    if (!instance) {
      return;
    }
    addField(instance, field);
    if (focusBeforeRegistered.current != null) {
      setFieldFocused(instance, field, focusBeforeRegistered.current);
      focusBeforeRegistered.current = null;
    }
    return () => {
      removeField(instance, field);
      hostInstance.current = null;
    };
  }, [hostRef, field]);

  return {
    ref: useMergeRefs(ref, nativeRef),
    onFocusChange: useCallback(
      (focused: boolean) => {
        isFocused.current = focused;
        if (hostInstance.current) {
          setFieldFocused(hostInstance.current, field, focused);
        } else {
          focusBeforeRegistered.current = focused;
        }
        onFocusChange?.(focused);
      },
      [field, onFocusChange]
    ),
  };
}

/**
 * Calls one of the field's imperative view functions. They are async functions,
 * so a rejection would otherwise surface as an unhandled rejection inside React
 * Native's touch handling.
 */
function callHandle(handle: TextInputHandle | null, method: 'focus' | 'blur') {
  const call = handle?.[method];
  if (typeof call !== 'function') {
    return;
  }
  try {
    const result = call.call(handle);
    if (result && typeof (result as Promise<unknown>).catch === 'function') {
      (result as Promise<unknown>).catch(() => {});
    }
  } catch {
    // A field whose native view has gone cannot be focused or blurred.
  }
}
