import { requireNativeView } from 'expo';
import type { ColorValue } from 'react-native';

import type { CommonTextFieldProps, TextFieldRef } from './shared';
import { getStateId, useWorkletProp, worklets } from '../../State';
import type { ViewEvent } from '../../types';
import { Slot } from '../SlotView';
import { createViewModifierEventListener } from '../modifiers/utils';

// region Types

/**
 * Imperative methods for `BasicTextField`. Identical to {@link TextFieldRef}.
 */
export type BasicTextFieldRef = TextFieldRef;

/**
 * Props for `BasicTextField`. Mirrors Compose's `BasicTextField`: a bare,
 * unstyled text field with no Material chrome (no container, indicator, or
 * built-in padding). Shares {@link CommonTextFieldProps} with `TextField` and
 * `OutlinedTextField`; use `BasicTextField.DecorationBox` to add your own
 * decoration.
 */
export type BasicTextFieldProps = CommonTextFieldProps & {
  /**
   * Color of the text cursor. Maps to Compose's `cursorBrush` via
   * `SolidColor(color)`. Defaults to black.
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
> & {
  children?: React.ReactNode;
  value?: number | null;
  selection?: number | null;
  onValueChangeSync?: number | null;
} & ViewEvent<'onValueChange', { text: string; selection: { start: number; end: number } }> &
  ViewEvent<'onFocusChanged', { value: boolean }> &
  ViewEvent<'onSelectionChange', { start: number; end: number }> &
  ViewEvent<'onKeyboardAction', { action: string; value: string }>;

const BasicTextFieldNativeView: React.ComponentType<NativeBasicTextFieldProps> = requireNativeView(
  'ExpoUI',
  'BasicTextFieldView'
);

const InnerTextFieldNativeView: React.ComponentType<object> = requireNativeView(
  'ExpoUI',
  'InnerTextFieldView'
);

function useTransformedProps(props: BasicTextFieldProps): NativeBasicTextFieldProps {
  const {
    value,
    selection,
    modifiers,
    children,
    keyboardActions,
    onValueChange,
    onFocusChanged,
    onSelectionChange,
    ...restProps
  } = props;

  const isWorklet = !!onValueChange && !!worklets?.isWorkletFunction?.(onValueChange);
  const workletCallback = useWorkletProp(isWorklet ? onValueChange : undefined, 'onValueChange');

  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
    children,
    value: getStateId(value),
    selection: getStateId(selection),
    onValueChangeSync: getStateId(workletCallback),
    onValueChange:
      !isWorklet && onValueChange ? (event) => onValueChange(event.nativeEvent.text) : undefined,
    onFocusChanged: onFocusChanged ? (event) => onFocusChanged(event.nativeEvent.value) : undefined,
    onSelectionChange: onSelectionChange
      ? (event) => onSelectionChange({ start: event.nativeEvent.start, end: event.nativeEvent.end })
      : undefined,
    onKeyboardAction: keyboardActions
      ? (event) => {
          const { action, value } = event.nativeEvent;
          const actionMap: Record<string, ((v: string) => void) | undefined> = {
            done: keyboardActions.onDone,
            go: keyboardActions.onGo,
            next: keyboardActions.onNext,
            previous: keyboardActions.onPrevious,
            search: keyboardActions.onSearch,
            send: keyboardActions.onSend,
          };
          actionMap[action]?.(value);
        }
      : undefined,
  };
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

// endregion Component

export { BasicTextFieldComponent as BasicTextField };
