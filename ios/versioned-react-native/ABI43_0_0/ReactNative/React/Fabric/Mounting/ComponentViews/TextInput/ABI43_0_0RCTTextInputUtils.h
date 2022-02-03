/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI43_0_0React/ABI43_0_0RCTBackedTextInputViewProtocol.h>
#import <better/optional.h>
#import <ABI43_0_0React/ABI43_0_0renderer/components/iostextinput/primitives.h>

NS_ASSUME_NONNULL_BEGIN

void ABI43_0_0RCTCopyBackedTextInput(
    UIView<ABI43_0_0RCTBackedTextInputViewProtocol> *fromTextInput,
    UIView<ABI43_0_0RCTBackedTextInputViewProtocol> *toTextInput);

UITextAutocorrectionType ABI43_0_0RCTUITextAutocorrectionTypeFromOptionalBool(ABI43_0_0facebook::better::optional<bool> autoCorrect);

UITextAutocapitalizationType ABI43_0_0RCTUITextAutocapitalizationTypeFromAutocapitalizationType(
    ABI43_0_0facebook::ABI43_0_0React::AutocapitalizationType autocapitalizationType);

UIKeyboardAppearance ABI43_0_0RCTUIKeyboardAppearanceFromKeyboardAppearance(
    ABI43_0_0facebook::ABI43_0_0React::KeyboardAppearance keyboardAppearance);

UITextSpellCheckingType ABI43_0_0RCTUITextSpellCheckingTypeFromOptionalBool(ABI43_0_0facebook::better::optional<bool> spellCheck);

UITextFieldViewMode ABI43_0_0RCTUITextFieldViewModeFromTextInputAccessoryVisibilityMode(
    ABI43_0_0facebook::ABI43_0_0React::TextInputAccessoryVisibilityMode mode);

UIKeyboardType ABI43_0_0RCTUIKeyboardTypeFromKeyboardType(ABI43_0_0facebook::ABI43_0_0React::KeyboardType keyboardType);

UIReturnKeyType ABI43_0_0RCTUIReturnKeyTypeFromReturnKeyType(ABI43_0_0facebook::ABI43_0_0React::ReturnKeyType returnKeyType);

API_AVAILABLE(ios(10.0))
UITextContentType ABI43_0_0RCTUITextContentTypeFromString(std::string const &contentType);

API_AVAILABLE(ios(12.0))
UITextInputPasswordRules *ABI43_0_0RCTUITextInputPasswordRulesFromString(std::string const &passwordRules);

NS_ASSUME_NONNULL_END
