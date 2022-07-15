/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <optional>

#import <ABI46_0_0React/ABI46_0_0RCTBackedTextInputViewProtocol.h>
#import <ABI46_0_0React/ABI46_0_0renderer/components/iostextinput/primitives.h>

NS_ASSUME_NONNULL_BEGIN

void ABI46_0_0RCTCopyBackedTextInput(
    UIView<ABI46_0_0RCTBackedTextInputViewProtocol> *fromTextInput,
    UIView<ABI46_0_0RCTBackedTextInputViewProtocol> *toTextInput);

UITextAutocorrectionType ABI46_0_0RCTUITextAutocorrectionTypeFromOptionalBool(std::optional<bool> autoCorrect);

UITextAutocapitalizationType ABI46_0_0RCTUITextAutocapitalizationTypeFromAutocapitalizationType(
    ABI46_0_0facebook::ABI46_0_0React::AutocapitalizationType autocapitalizationType);

UIKeyboardAppearance ABI46_0_0RCTUIKeyboardAppearanceFromKeyboardAppearance(
    ABI46_0_0facebook::ABI46_0_0React::KeyboardAppearance keyboardAppearance);

UITextSpellCheckingType ABI46_0_0RCTUITextSpellCheckingTypeFromOptionalBool(std::optional<bool> spellCheck);

UITextFieldViewMode ABI46_0_0RCTUITextFieldViewModeFromTextInputAccessoryVisibilityMode(
    ABI46_0_0facebook::ABI46_0_0React::TextInputAccessoryVisibilityMode mode);

UIKeyboardType ABI46_0_0RCTUIKeyboardTypeFromKeyboardType(ABI46_0_0facebook::ABI46_0_0React::KeyboardType keyboardType);

UIReturnKeyType ABI46_0_0RCTUIReturnKeyTypeFromReturnKeyType(ABI46_0_0facebook::ABI46_0_0React::ReturnKeyType returnKeyType);

API_AVAILABLE(ios(10.0))
UITextContentType ABI46_0_0RCTUITextContentTypeFromString(std::string const &contentType);

API_AVAILABLE(ios(12.0))
UITextInputPasswordRules *ABI46_0_0RCTUITextInputPasswordRulesFromString(std::string const &passwordRules);

NS_ASSUME_NONNULL_END
