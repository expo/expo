import type { KeyboardTypeOptions, ReturnKeyTypeOptions } from 'react-native';
export type InputMode = 'none' | 'text' | 'decimal' | 'numeric' | 'tel' | 'search' | 'email' | 'url';
export type EnterKeyHint = 'enter' | 'done' | 'go' | 'next' | 'previous' | 'search' | 'send';
export declare function inputModeToKeyboardType(inputMode: InputMode | undefined): KeyboardTypeOptions | undefined;
export declare function enterKeyHintToReturnKeyType(hint: EnterKeyHint | undefined): ReturnKeyTypeOptions | undefined;
export declare function resolveEditable(editable: boolean | undefined, readOnly: boolean | undefined): boolean | undefined;
//# sourceMappingURL=utils.d.ts.map