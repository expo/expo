import { requireNativeView } from 'expo';
import type { ColorValue } from 'react-native';

import {
  type CommonNativeTextFieldProps,
  type CommonTextFieldProperties,
  type TextFieldRef,
  useCommonTextFieldProps,
} from './shared';
import { Slot } from '../SlotView';

// region Types

/**
 * Imperative methods for `BasicTextField`. Identical to {@link TextFieldRef}.
 */
export type BasicTextFieldRef = TextFieldRef;

/**
 * Props for `BasicTextField`. Mirrors Compose's `BasicTextField`: a bare,
 * unstyled text field with no Material chrome (no container, indicator, or
 * built-in padding). Shares {@link CommonTextFieldProperties} with `TextField` and
 * `OutlinedTextField`; use `BasicTextField.DecorationBox` to add your own
 * decoration.
 */
export type BasicTextFieldProps = CommonTextFieldProperties & {
  /**
   * Color of the text cursor. Maps to Compose's `cursorBrush` via
   * `SolidColor(color)`. Defaults to the theme's primary color
   * (`MaterialTheme.colorScheme.primary`) so it stays visible in light and dark.
   */
  cursorColor?: ColorValue;
};

// endregion Types

// region Native

type NativeBasicTextFieldProps = Omit<
  BasicTextFieldProps,
  | 'value'
  | 'selection'
  | 'onValueChange'
  | 'onFocusChanged'
  | 'onSelectionChange'
  | 'keyboardActions'
  | 'children'
> &
  CommonNativeTextFieldProps;

const BasicTextFieldNativeView: React.ComponentType<NativeBasicTextFieldProps> = requireNativeView(
  'ExpoUI',
  'BasicTextFieldView'
);

const InnerTextFieldNativeView: React.ComponentType<object> = requireNativeView(
  'ExpoUI',
  'InnerTextFieldView'
);

const PlaceholderNativeView: React.ComponentType<{ children?: React.ReactNode }> =
  requireNativeView('ExpoUI', 'PlaceholderView');

function useTransformedProps(props: BasicTextFieldProps): NativeBasicTextFieldProps {
  return useCommonTextFieldProps(props);
}

// endregion Native

// region Slot components

/**
 * Wraps the editable text with custom decoration. Maps to Compose's
 * `decorationBox`. Place {@link InnerTextField} inside it where the text
 * should render.
 */
function DecorationBox(props: { children: React.ReactNode }) {
  return <Slot slotName="decorationBox">{props.children}</Slot>;
}

/**
 * The editable text itself, placed wherever you want it inside
 * {@link DecorationBox}. Maps to the `innerTextField` lambda Compose passes to
 * `decorationBox`.
 */
function InnerTextField() {
  return <InnerTextFieldNativeView />;
}

/**
 * A placeholder shown only while the field is empty. Place it inside
 * {@link DecorationBox}, typically overlaying {@link InnerTextField}. Its
 * visibility is toggled natively from the field's text, so it stays correct for
 * every change — typing, `clear()`, `setText`, and writes to the `value`
 * observable — without a JS round-trip.
 */
function Placeholder(props: { children: React.ReactNode }) {
  return <PlaceholderNativeView>{props.children}</PlaceholderNativeView>;
}

// endregion Slot components

// region Component

/**
 * A bare, unstyled Compose `BasicTextField` with no Material decoration.
 */
function BasicTextFieldComponent(props: BasicTextFieldProps) {
  return <BasicTextFieldNativeView {...useTransformedProps(props)} />;
}

BasicTextFieldComponent.DecorationBox = DecorationBox;
BasicTextFieldComponent.InnerTextField = InnerTextField;
BasicTextFieldComponent.Placeholder = Placeholder;

// endregion Component

export { BasicTextFieldComponent as BasicTextField };
