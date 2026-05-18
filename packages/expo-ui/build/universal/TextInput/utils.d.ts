import type { ComponentProps } from 'react';
import type { KeyboardTypeOptions, ReturnKeyTypeOptions, TextInput as RNTextInput } from 'react-native';
type RNProps = ComponentProps<typeof RNTextInput>;
export type AutoComplete = NonNullable<RNProps['autoComplete']>;
export type InputMode = 'none' | 'text' | 'decimal' | 'numeric' | 'tel' | 'search' | 'email' | 'url';
export type EnterKeyHint = 'enter' | 'done' | 'go' | 'next' | 'previous' | 'search' | 'send';
export declare function inputModeToKeyboardType(inputMode: InputMode | undefined): KeyboardTypeOptions | undefined;
export declare function enterKeyHintToReturnKeyType(hint: EnterKeyHint | undefined): ReturnKeyTypeOptions | undefined;
export declare function resolveEditable(editable: boolean | undefined, readOnly: boolean | undefined): boolean | undefined;
/**
 * Maps RN's `autoComplete` value to the SwiftUI `textContentType` modifier
 * value (mirrors RN-iOS's internal mapping in `TextInput.js`).
 */
export declare function autoCompleteToTextContentType(ac: AutoComplete | undefined): string | undefined;
export {};
//# sourceMappingURL=utils.d.ts.map