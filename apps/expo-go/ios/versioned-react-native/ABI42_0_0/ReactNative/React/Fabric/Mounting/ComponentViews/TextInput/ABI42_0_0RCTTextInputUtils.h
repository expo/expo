/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI42_0_0React/ABI42_0_0RCTBackedTextInputViewProtocol.h>
#import <better/optional.h>
#import <ABI42_0_0React/components/iostextinput/primitives.h>

NS_ASSUME_NONNULL_BEGIN

void ABI42_0_0RCTCopyBackedTextInput(
    UIView<ABI42_0_0RCTBackedTextInputViewProtocol> *fromTextInput,
    UIView<ABI42_0_0RCTBackedTextInputViewProtocol> *toTextInput);

UITextAutocorrectionType ABI42_0_0RCTUITextAutocorrectionTypeFromOptionalBool(ABI42_0_0facebook::better::optional<bool> autoCorrect);

UITextAutocapitalizationType ABI42_0_0RCTUITextAutocapitalizationTypeFromAutocapitalizationType(
    ABI42_0_0facebook::ABI42_0_0React::AutocapitalizationType autocapitalizationType);

UIKeyboardAppearance ABI42_0_0RCTUIKeyboardAppearanceFromKeyboardAppearance(
    ABI42_0_0facebook::ABI42_0_0React::KeyboardAppearance keyboardAppearance);

UITextSpellCheckingType ABI42_0_0RCTUITextSpellCheckingTypeFromOptionalBool(ABI42_0_0facebook::better::optional<bool> spellCheck);

UITextFieldViewMode ABI42_0_0RCTUITextFieldViewModeFromTextInputAccessoryVisibilityMode(
    ABI42_0_0facebook::ABI42_0_0React::TextInputAccessoryVisibilityMode mode);

UIKeyboardType ABI42_0_0RCTUIKeyboardTypeFromKeyboardType(ABI42_0_0facebook::ABI42_0_0React::KeyboardType keyboardType);

UIReturnKeyType ABI42_0_0RCTUIReturnKeyTypeFromReturnKeyType(ABI42_0_0facebook::ABI42_0_0React::ReturnKeyType returnKeyType);

API_AVAILABLE(ios(10.0))
UITextContentType ABI42_0_0RCTUITextContentTypeFromString(std::string const &contentType);

API_AVAILABLE(ios(12.0))
UITextInputPasswordRules *ABI42_0_0RCTUITextInputPasswordRulesFromString(std::string const &passwordRules);

NS_ASSUME_NONNULL_END
