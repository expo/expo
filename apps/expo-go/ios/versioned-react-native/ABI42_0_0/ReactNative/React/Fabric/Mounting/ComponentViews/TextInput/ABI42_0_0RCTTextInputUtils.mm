/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI42_0_0RCTTextInputUtils.h"

#import <ABI42_0_0React/ABI42_0_0RCTConversions.h>

using namespace ABI42_0_0facebook::ABI42_0_0React;

static NSAttributedString *ABI42_0_0RCTSanitizeAttributedString(NSAttributedString *attributedString)
{
  // Here we need to remove text attributes specific to particular kind of TextInput on iOS (e.g. limiting line number).
  // TODO: Implement it properly.
  return [[NSAttributedString alloc] initWithString:attributedString.string];
}

void ABI42_0_0RCTCopyBackedTextInput(
    UIView<ABI42_0_0RCTBackedTextInputViewProtocol> *fromTextInput,
    UIView<ABI42_0_0RCTBackedTextInputViewProtocol> *toTextInput)
{
  toTextInput.attributedText = ABI42_0_0RCTSanitizeAttributedString(fromTextInput.attributedText);
  toTextInput.placeholder = fromTextInput.placeholder;
  toTextInput.placeholderColor = fromTextInput.placeholderColor;
  toTextInput.textContainerInset = fromTextInput.textContainerInset;
  toTextInput.inputAccessoryView = fromTextInput.inputAccessoryView;
  toTextInput.textInputDelegate = fromTextInput.textInputDelegate;
  toTextInput.placeholderColor = fromTextInput.placeholderColor;
  toTextInput.defaultTextAttributes = fromTextInput.defaultTextAttributes;
  toTextInput.autocapitalizationType = fromTextInput.autocapitalizationType;
  toTextInput.autocorrectionType = fromTextInput.autocorrectionType;
  toTextInput.contextMenuHidden = fromTextInput.contextMenuHidden;
  toTextInput.editable = fromTextInput.editable;
  toTextInput.enablesReturnKeyAutomatically = fromTextInput.enablesReturnKeyAutomatically;
  toTextInput.keyboardAppearance = fromTextInput.keyboardAppearance;
  toTextInput.spellCheckingType = fromTextInput.spellCheckingType;
  toTextInput.caretHidden = fromTextInput.caretHidden;
  toTextInput.clearButtonMode = fromTextInput.clearButtonMode;
  toTextInput.scrollEnabled = fromTextInput.scrollEnabled;
  toTextInput.secureTextEntry = fromTextInput.secureTextEntry;
  toTextInput.keyboardType = fromTextInput.keyboardType;

  if (@available(iOS 10.0, *)) {
    toTextInput.textContentType = fromTextInput.textContentType;
  }

  if (@available(iOS 12.0, *)) {
    toTextInput.passwordRules = fromTextInput.passwordRules;
  }

  [toTextInput setSelectedTextRange:fromTextInput.selectedTextRange notifyDelegate:NO];
}

UITextAutocorrectionType ABI42_0_0RCTUITextAutocorrectionTypeFromOptionalBool(ABI42_0_0facebook::better::optional<bool> autoCorrect)
{
  return autoCorrect.has_value() ? (*autoCorrect ? UITextAutocorrectionTypeYes : UITextAutocorrectionTypeNo)
                                 : UITextAutocorrectionTypeDefault;
}

UITextAutocapitalizationType ABI42_0_0RCTUITextAutocapitalizationTypeFromAutocapitalizationType(
    AutocapitalizationType autocapitalizationType)
{
  switch (autocapitalizationType) {
    case AutocapitalizationType::None:
      return UITextAutocapitalizationTypeNone;
    case AutocapitalizationType::Words:
      return UITextAutocapitalizationTypeWords;
    case AutocapitalizationType::Sentences:
      return UITextAutocapitalizationTypeSentences;
    case AutocapitalizationType::Characters:
      return UITextAutocapitalizationTypeAllCharacters;
  }
}

UIKeyboardAppearance ABI42_0_0RCTUIKeyboardAppearanceFromKeyboardAppearance(KeyboardAppearance keyboardAppearance)
{
  switch (keyboardAppearance) {
    case KeyboardAppearance::Default:
      return UIKeyboardAppearanceDefault;
    case KeyboardAppearance::Light:
      return UIKeyboardAppearanceLight;
    case KeyboardAppearance::Dark:
      return UIKeyboardAppearanceDark;
  }
}

UITextSpellCheckingType ABI42_0_0RCTUITextSpellCheckingTypeFromOptionalBool(ABI42_0_0facebook::better::optional<bool> spellCheck)
{
  return spellCheck.has_value() ? (*spellCheck ? UITextSpellCheckingTypeYes : UITextSpellCheckingTypeNo)
                                : UITextSpellCheckingTypeDefault;
}

UITextFieldViewMode ABI42_0_0RCTUITextFieldViewModeFromTextInputAccessoryVisibilityMode(
    ABI42_0_0facebook::ABI42_0_0React::TextInputAccessoryVisibilityMode mode)
{
  switch (mode) {
    case TextInputAccessoryVisibilityMode::Never:
      return UITextFieldViewModeNever;
    case TextInputAccessoryVisibilityMode::WhileEditing:
      return UITextFieldViewModeWhileEditing;
    case TextInputAccessoryVisibilityMode::UnlessEditing:
      return UITextFieldViewModeUnlessEditing;
    case TextInputAccessoryVisibilityMode::Always:
      return UITextFieldViewModeAlways;
  }
}

UIKeyboardType ABI42_0_0RCTUIKeyboardTypeFromKeyboardType(KeyboardType keyboardType)
{
  switch (keyboardType) {
    // Universal
    case KeyboardType::Default:
      return UIKeyboardTypeDefault;
    case KeyboardType::EmailAddress:
      return UIKeyboardTypeEmailAddress;
    case KeyboardType::Numeric:
      return UIKeyboardTypeDecimalPad;
    case KeyboardType::PhonePad:
      return UIKeyboardTypePhonePad;
    case KeyboardType::NumberPad:
      return UIKeyboardTypeNumberPad;
    case KeyboardType::DecimalPad:
      return UIKeyboardTypeDecimalPad;
    // iOS-only
    case KeyboardType::ASCIICapable:
      return UIKeyboardTypeASCIICapable;
    case KeyboardType::NumbersAndPunctuation:
      return UIKeyboardTypeNumbersAndPunctuation;
    case KeyboardType::URL:
      return UIKeyboardTypeURL;
    case KeyboardType::NamePhonePad:
      return UIKeyboardTypeNamePhonePad;
    case KeyboardType::Twitter:
      return UIKeyboardTypeTwitter;
    case KeyboardType::WebSearch:
      return UIKeyboardTypeWebSearch;
    case KeyboardType::ASCIICapableNumberPad:
      if (@available(iOS 10.0, *)) {
        return UIKeyboardTypeASCIICapableNumberPad;
      } else {
        return UIKeyboardTypeNumberPad;
      }
    // Android-only
    case KeyboardType::VisiblePassword:
      return UIKeyboardTypeDefault;
  }
}

UIReturnKeyType ABI42_0_0RCTUIReturnKeyTypeFromReturnKeyType(ReturnKeyType returnKeyType)
{
  switch (returnKeyType) {
    case ReturnKeyType::Default:
      return UIReturnKeyDefault;
    case ReturnKeyType::Done:
      return UIReturnKeyDone;
    case ReturnKeyType::Go:
      return UIReturnKeyGo;
    case ReturnKeyType::Next:
      return UIReturnKeyNext;
    case ReturnKeyType::Search:
      return UIReturnKeySearch;
    case ReturnKeyType::Send:
      return UIReturnKeySend;
    // iOS-only
    case ReturnKeyType::EmergencyCall:
      return UIReturnKeyEmergencyCall;
    case ReturnKeyType::Google:
      return UIReturnKeyGoogle;
    case ReturnKeyType::Join:
      return UIReturnKeyJoin;
    case ReturnKeyType::Route:
      return UIReturnKeyRoute;
    case ReturnKeyType::Yahoo:
      return UIReturnKeyYahoo;
    case ReturnKeyType::Continue:
      return UIReturnKeyContinue;
    // Android-only
    case ReturnKeyType::None:
    case ReturnKeyType::Previous:
      return UIReturnKeyDefault;
  }
}

API_AVAILABLE(ios(10.0))
UITextContentType ABI42_0_0RCTUITextContentTypeFromString(std::string const &contentType)
{
  // TODO: Implement properly (T26519801).
  return ABI42_0_0RCTNSStringFromStringNilIfEmpty(contentType);
}

API_AVAILABLE(ios(12.0))
UITextInputPasswordRules *ABI42_0_0RCTUITextInputPasswordRulesFromString(std::string const &passwordRules)
{
  return [UITextInputPasswordRules passwordRulesWithDescriptor:ABI42_0_0RCTNSStringFromStringNilIfEmpty(passwordRules)];
}
