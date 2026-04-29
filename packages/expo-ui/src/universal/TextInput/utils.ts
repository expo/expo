import type { KeyboardTypeOptions, ReturnKeyTypeOptions } from 'react-native';

export type InputMode =
  | 'none'
  | 'text'
  | 'decimal'
  | 'numeric'
  | 'tel'
  | 'search'
  | 'email'
  | 'url';

export type EnterKeyHint = 'enter' | 'done' | 'go' | 'next' | 'previous' | 'search' | 'send';

export function inputModeToKeyboardType(
  inputMode: InputMode | undefined
): KeyboardTypeOptions | undefined {
  if (!inputMode || inputMode === 'none') return undefined;
  switch (inputMode) {
    case 'text':
      return 'default';
    case 'decimal':
      return 'decimal-pad';
    case 'tel':
      return 'phone-pad';
    case 'search':
      return 'web-search';
    case 'email':
      return 'email-address';
    default:
      return inputMode as KeyboardTypeOptions;
  }
}

export function enterKeyHintToReturnKeyType(
  hint: EnterKeyHint | undefined
): ReturnKeyTypeOptions | undefined {
  if (!hint) return undefined;
  if (hint === 'enter') return 'default';
  return hint as ReturnKeyTypeOptions;
}

export function resolveEditable(
  editable: boolean | undefined,
  readOnly: boolean | undefined
): boolean | undefined {
  if (editable !== undefined) return editable;
  if (readOnly === true) return false;
  return undefined;
}
