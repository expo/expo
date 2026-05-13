import type { Ref } from 'react';
import type { ColorValue, KeyboardTypeOptions, ReturnKeyTypeOptions } from 'react-native';

import type { ModifierConfig } from '../../types';
import type { ObservableState } from '../State';
import type { AutoComplete, EnterKeyHint, InputMode } from './utils';
import type { UniversalTextStyle } from '../Text/types';
import type { UniversalStyle } from '../types';

/**
 * Imperative methods exposed via the `TextInput` ref.
 */
export type TextInputRef = {
  /** Programmatically focus the input. */
  focus: () => void;
  /** Programmatically blur the input. */
  blur: () => void;
  /** Clear the current text. */
  clear: () => void;
  /** Returns whether the input currently has focus. */
  isFocused: () => boolean;
  /**
   * Programmatically set the selection range.
   * @platform ios 18.0+
   */
  setSelection: (start: number, end: number) => Promise<void>;
};

/**
 * Props for the `TextInput` component.
 */
export interface TextInputProps {
  /**
   * Ref exposing imperative methods (`focus`, `blur`, `clear`).
   */
  ref?: Ref<TextInputRef>;

  /**
   * An observable state holding the current text. Create one with
   * `useNativeState('initial value')` from `@expo/ui`.
   * Omit to let the field manage its own internal state.
   */
  value?: ObservableState<string>;

  /**
   * Called every time the text value changes. Receives the new string.
   */
  onChangeText?: (text: string) => void;

  /**
   * Placeholder text shown when the field is empty.
   */
  placeholder?: string;

  /**
   * If true, focuses the input on mount.
   * @default false
   */
  autoFocus?: boolean;

  /**
   * If false, the input cannot be edited. Selection is still allowed so the
   * user can copy text out of the field.
   * @default true
   */
  editable?: boolean;

  /**
   * If true, the field accepts multiple lines of input and grows vertically
   * as the user types.
   * @default false
   */
  multiline?: boolean;

  /**
   * If true, the input obscures its text — used for password fields.
   * - iOS: backed by SwiftUI's `SecureField`. The following props are no-ops
   *   in this mode: `selection`, `selectTextOnFocus`, `onSelectionChange`,
   *   `multiline`, `numberOfLines`.
   * - Android: backed by Compose's `PasswordVisualTransformation`.
   * @default false
   */
  secureTextEntry?: boolean;

  /**
   * Determines which keyboard variant is shown.
   *
   * Lacking native support:
   * - iOS: `'visible-password'` falls back to the default keyboard.
   * - Android: iOS-specific values (`'ascii-capable'`,
   *   `'numbers-and-punctuation'`, `'name-phone-pad'`, `'twitter'`,
   *   `'web-search'`) fall back to the text keyboard.
   *
   * @default 'default'
   */
  keyboardType?: KeyboardTypeOptions;

  /**
   * Controls automatic capitalization of input.
   * @default 'sentences'
   */
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';

  /**
   * If false, disables autocorrect / spellcheck suggestions.
   * @default true
   */
  autoCorrect?: boolean;

  /**
   * Determines the label of the keyboard return key.
   *
   * Lacking native support:
   * - iOS: `'emergency-call'` falls back to the default Return key.
   * - Android: `'join'`, `'route'`, `'emergency-call'` fall back to the
   *   default action.
   */
  returnKeyType?: ReturnKeyTypeOptions;

  /**
   * Called when the user taps the keyboard return key. Receives the current
   * text in the input.
   */
  onSubmitEditing?: (text: string) => void;

  /**
   * Called when the field gains focus.
   */
  onFocus?: () => void;

  /**
   * Called when the field loses focus.
   */
  onBlur?: () => void;

  /**
   * Color of the text cursor.
   */
  cursorColor?: ColorValue;

  /**
   * Horizontal alignment of the text content.
   *
   * Lacking native support:
   * - iOS: `'justify'` is not supported by SwiftUI's `TextField` and falls
   *   back to the default alignment.
   *
   * @default 'auto'
   */
  textAlign?: 'auto' | 'left' | 'right' | 'center' | 'justify';

  /**
   * Alias for `editable={false}`. When both are set, `editable` wins.
   * @default false
   */
  readOnly?: boolean;

  /**
   * HTML-style hint for the keyboard variant. Maps to `keyboardType`. When
   * both are set, `keyboardType` wins.
   */
  inputMode?: InputMode;

  /**
   * HTML-style hint for the keyboard return key. Maps to `returnKeyType`.
   * When both are set, `returnKeyType` wins.
   */
  enterKeyHint?: EnterKeyHint;

  /**
   * Initial text shown when the input mounts and `value` is not provided.
   * Ignored once the user starts typing or if `value` is set.
   */
  defaultValue?: string;

  /**
   * Autofill hint. iOS maps to `textContentType`; Android maps to Compose's
   * `Modifier.semantics { contentType = ... }`.
   */
  autoComplete?: AutoComplete;

  /**
   * Number of lines the field reserves when `multiline` is true. Forces a
   * fixed visible height of that many lines.
   *
   * Lacking native support:
   * - iOS: requires iOS 16+; below that, the field grows naturally.
   */
  numberOfLines?: number;

  /**
   * HTML-style alias for `numberOfLines`. When both are set, `numberOfLines` wins.
   */
  rows?: number;

  /**
   * Color of the underline indicator on Android. iOS / web ignore this.
   * @platform android
   */
  underlineColorAndroid?: ColorValue;

  /**
   * Color of the placeholder text.
   */
  placeholderTextColor?: ColorValue;

  /**
   * Called when the rendered size of the input changes. Sizes in points/dp.
   *
   * Unlike RN's `onContentSizeChange`, this dispatches the *view*'s outer
   * geometry, including any padding/border applied via `style` or modifiers.
   * If you use this for autogrow, account for that.
   */
  onContentSizeChange?: (size: { width: number; height: number }) => void;

  /**
   * Maximum number of characters allowed.
   */
  maxLength?: number;

  /**
   * If true, the cursor is hidden.
   *
   * On iOS, this is implemented via `tint('transparent')`, which also makes
   * the selection highlight invisible. If you set both `caretHidden` and
   * `selectionColor`, the caret-hide wins on iOS.
   */
  caretHidden?: boolean;

  /**
   * Color of the selected text highlight. On iOS this also tints the cursor
   * (UIKit's `tintColor` covers both); pass `cursorColor` only if you want
   * different cursor color on Android.
   */
  selectionColor?: ColorValue;

  /**
   * Color of the selection drag handles.
   * @platform android
   */
  selectionHandleColor?: ColorValue;

  /**
   * Observable state the field writes the current selection to.
   * Create with `useNativeState({ start: 0, end: 0 })`.
   * Use `ref.setSelection(start, end)` to set selection programmatically.
   * @platform ios 18.0+ — pre-iOS 18 the prop is ignored.
   */
  selection?: ObservableState<{ start: number; end: number }>;

  /**
   * Called when the text selection range changes.
   */
  onSelectionChange?: (selection: { start: number; end: number }) => void;

  /**
   * If true, all text is selected when the field gains focus. Implemented
   * via `setSelection(0, length)` on focus, so if you also pass `selection`,
   * its value is overwritten on every focus.
   * @default false
   * @platform ios 18.0+, android, web
   */
  selectTextOnFocus?: boolean;

  /**
   * Identifier used to locate the component in end-to-end tests.
   */
  testID?: string;

  /**
   * Box-level style — sizing, padding, background, border, opacity.
   */
  style?: UniversalStyle;

  /**
   * Text-level style — font, color, alignment, spacing.
   */
  textStyle?: UniversalTextStyle;

  /**
   * Platform-specific modifier escape hatch. Pass an array of modifier configs
   * from `@expo/ui/swift-ui/modifiers` or `@expo/ui/jetpack-compose/modifiers`.
   * Modifiers from the wrong platform are ignored at runtime.
   * @platform android
   * @platform ios
   */
  modifiers?: ModifierConfig[];
}
