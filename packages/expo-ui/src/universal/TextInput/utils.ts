import type { ComponentProps } from 'react';
import type {
  KeyboardTypeOptions,
  ReturnKeyTypeOptions,
  TextInput as RNTextInput,
} from 'react-native';

type RNProps = ComponentProps<typeof RNTextInput>;
export type AutoComplete = NonNullable<RNProps['autoComplete']>;

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

/**
 * Maps RN's `autoComplete` value to the SwiftUI `textContentType` modifier
 * value (mirrors RN-iOS's internal mapping in `TextInput.js`).
 */
export function autoCompleteToTextContentType(ac: AutoComplete | undefined): string | undefined {
  if (!ac) return undefined;
  return AUTO_COMPLETE_TO_TEXT_CONTENT_TYPE[ac];
}

const AUTO_COMPLETE_TO_TEXT_CONTENT_TYPE: Partial<Record<AutoComplete, string>> = {
  'additional-name': 'middleName',
  'address-line1': 'streetAddressLine1',
  'address-line2': 'streetAddressLine2',
  'birthdate-day': 'birthdateDay',
  'birthdate-full': 'birthdate',
  'birthdate-month': 'birthdateMonth',
  'birthdate-year': 'birthdateYear',
  'cc-csc': 'creditCardSecurityCode',
  'cc-exp': 'creditCardExpiration',
  'cc-exp-month': 'creditCardExpirationMonth',
  'cc-exp-year': 'creditCardExpirationYear',
  'cc-family-name': 'creditCardFamilyName',
  'cc-given-name': 'creditCardGivenName',
  'cc-middle-name': 'creditCardMiddleName',
  'cc-name': 'creditCardName',
  'cc-number': 'creditCardNumber',
  'cc-type': 'creditCardType',
  country: 'countryName',
  'current-password': 'password',
  email: 'emailAddress',
  'family-name': 'familyName',
  'given-name': 'givenName',
  'honorific-prefix': 'namePrefix',
  'honorific-suffix': 'nameSuffix',
  name: 'name',
  'name-family': 'familyName',
  'name-given': 'givenName',
  'name-middle': 'middleName',
  'name-prefix': 'namePrefix',
  'name-suffix': 'nameSuffix',
  'new-password': 'newPassword',
  nickname: 'nickname',
  'one-time-code': 'oneTimeCode',
  organization: 'organizationName',
  'organization-title': 'jobTitle',
  password: 'password',
  'password-new': 'newPassword',
  'postal-address': 'fullStreetAddress',
  'postal-address-country': 'countryName',
  'postal-code': 'postalCode',
  'sms-otp': 'oneTimeCode',
  'street-address': 'fullStreetAddress',
  tel: 'telephoneNumber',
  url: 'URL',
  username: 'username',
};
