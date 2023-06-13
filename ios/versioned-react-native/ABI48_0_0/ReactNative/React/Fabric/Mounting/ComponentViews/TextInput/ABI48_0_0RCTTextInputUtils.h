/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <optional>

#import <ABI48_0_0React/ABI48_0_0RCTBackedTextInputViewProtocol.h>
#import <ABI48_0_0React/ABI48_0_0renderer/components/iostextinput/primitives.h>

NS_ASSUME_NONNULL_BEGIN

void ABI48_0_0RCTCopyBackedTextInput(
    UIView<ABI48_0_0RCTBackedTextInputViewProtocol> *fromTextInput,
    UIView<ABI48_0_0RCTBackedTextInputViewProtocol> *toTextInput);

UITextAutocorrectionType ABI48_0_0RCTUITextAutocorrectionTypeFromOptionalBool(std::optional<bool> autoCorrect);

UITextAutocapitalizationType ABI48_0_0RCTUITextAutocapitalizationTypeFromAutocapitalizationType(
    ABI48_0_0facebook::ABI48_0_0React::AutocapitalizationType autocapitalizationType);

UIKeyboardAppearance ABI48_0_0RCTUIKeyboardAppearanceFromKeyboardAppearance(
    ABI48_0_0facebook::ABI48_0_0React::KeyboardAppearance keyboardAppearance);

UITextSpellCheckingType ABI48_0_0RCTUITextSpellCheckingTypeFromOptionalBool(std::optional<bool> spellCheck);

UITextFieldViewMode ABI48_0_0RCTUITextFieldViewModeFromTextInputAccessoryVisibilityMode(
    ABI48_0_0facebook::ABI48_0_0React::TextInputAccessoryVisibilityMode mode);

UIKeyboardType ABI48_0_0RCTUIKeyboardTypeFromKeyboardType(ABI48_0_0facebook::ABI48_0_0React::KeyboardType keyboardType);

UIReturnKeyType ABI48_0_0RCTUIReturnKeyTypeFromReturnKeyType(ABI48_0_0facebook::ABI48_0_0React::ReturnKeyType returnKeyType);

API_AVAILABLE(ios(10.0))
UITextContentType ABI48_0_0RCTUITextContentTypeFromString(std::string const &contentType);

API_AVAILABLE(ios(12.0))
UITextInputPasswordRules *ABI48_0_0RCTUITextInputPasswordRulesFromString(std::string const &passwordRules);

NS_ASSUME_NONNULL_END
