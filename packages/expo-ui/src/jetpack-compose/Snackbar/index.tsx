import { requireNativeView } from 'expo';
import { type Ref } from 'react';
import { type ColorValue } from 'react-native';

import { type ModifierConfig } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';

export interface SnackbarProps {
  /**
   * The background color of the snackbar container.
   */
  containerColor?: ColorValue;
  /**
   * The preferred content color used for the message text.
   */
  contentColor?: ColorValue;
  /**
   * The content color used for the action button.
   */
  actionContentColor?: ColorValue;
  /**
   * The content color used for the dismiss-action icon button.
   */
  dismissActionContentColor?: ColorValue;
  /**
   * Whether the action should be placed on a new line below the message.
   * Useful for long action labels.
   * @default false
   */
  actionOnNewLine?: boolean;
  /**
   * Modifiers for the component.
   */
  modifiers?: ModifierConfig[];
}

const SnackbarNativeView: React.ComponentType<SnackbarProps> = requireNativeView(
  'ExpoUI',
  'SnackbarView'
);

/**
 * Styling configuration for the snackbar shown by `SnackbarHost`. Pass as a
 * child to override colors or place the action on a new line.
 */
export function Snackbar(props: SnackbarProps) {
  const { modifiers, ...rest } = props;
  return (
    <SnackbarNativeView
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      {...rest}
    />
  );
}

// --- SnackbarHost ---

/**
 * How long the snackbar is shown. Mirrors Compose's `SnackbarDuration` enum.
 */
export type SnackbarDuration = 'short' | 'long' | 'indefinite';

/**
 * Reason a snackbar invocation resolved. Mirrors Compose's `SnackbarResult` enum.
 */
export type SnackbarResult = 'actionPerformed' | 'dismissed';

export type SnackbarShowOptions = {
  /**
   * The message body of the snackbar.
   */
  message: string;
  /**
   * Label for the optional action button. When omitted, no action button is shown.
   */
  actionLabel?: string;
  /**
   * Whether to show a trailing close (X) icon button to dismiss the snackbar.
   * @default false
   */
  withDismissAction?: boolean;
  /**
   * How long to show the snackbar. Defaults to `'short'` when an `actionLabel`
   * is not provided, and `'indefinite'` when it is, matching Compose.
   */
  duration?: SnackbarDuration;
};

export type SnackbarHostRef = {
  /**
   * Shows a snackbar and resolves with `'actionPerformed'` when the user taps
   * the action, or `'dismissed'` when it times out or the dismiss-action
   * button is tapped. Subsequent calls queue and show after the current
   * snackbar is dismissed.
   */
  showSnackbar: (options: SnackbarShowOptions) => Promise<SnackbarResult>;
};

export interface SnackbarHostProps {
  /**
   * Ref exposing the imperative `showSnackbar` method.
   */
  ref?: Ref<SnackbarHostRef>;
  /**
   * Modifiers for the component.
   */
  modifiers?: ModifierConfig[];
  /**
   * Optional `Snackbar` child supplying styling for shown snackbars. Mirrors
   * Compose's `SnackbarHost(hostState) { data -> Snackbar(data, ...) }` lambda.
   */
  children?: React.ReactNode;
}

const SnackbarHostNativeView: React.ComponentType<SnackbarHostProps> = requireNativeView(
  'ExpoUI',
  'SnackbarHostView'
);

/**
 * A Material 3 [SnackbarHost](https://developer.android.com/develop/ui/compose/components/snackbar)
 * that displays snackbars triggered via its ref's `showSnackbar` method.
 */
export function SnackbarHost(props: SnackbarHostProps) {
  const { modifiers, children, ...rest } = props;
  return (
    <SnackbarHostNativeView
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      {...rest}>
      {children}
    </SnackbarHostNativeView>
  );
}
