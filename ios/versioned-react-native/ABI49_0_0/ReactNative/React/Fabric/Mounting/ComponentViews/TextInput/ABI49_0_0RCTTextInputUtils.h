/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <optional>

#import <ABI49_0_0React/ABI49_0_0RCTBackedTextInputViewProtocol.h>
#import <ABI49_0_0React/ABI49_0_0renderer/components/iostextinput/primitives.h>

NS_ASSUME_NONNULL_BEGIN

void ABI49_0_0RCTCopyBackedTextInput(
    UIView<ABI49_0_0RCTBackedTextInputViewProtocol> *fromTextInput,
    UIView<ABI49_0_0RCTBackedTextInputViewProtocol> *toTextInput);

UITextAutocorrectionType ABI49_0_0RCTUITextAutocorrectionTypeFromOptionalBool(std::optional<bool> autoCorrect);

UITextAutocapitalizationType ABI49_0_0RCTUITextAutocapitalizationTypeFromAutocapitalizationType(
    ABI49_0_0facebook::ABI49_0_0React::AutocapitalizationType autocapitalizationType);

UIKeyboardAppearance ABI49_0_0RCTUIKeyboardAppearanceFromKeyboardAppearance(
    ABI49_0_0facebook::ABI49_0_0React::KeyboardAppearance keyboardAppearance);

UITextSpellCheckingType ABI49_0_0RCTUITextSpellCheckingTypeFromOptionalBool(std::optional<bool> spellCheck);

UITextFieldViewMode ABI49_0_0RCTUITextFieldViewModeFromTextInputAccessoryVisibilityMode(
    ABI49_0_0facebook::ABI49_0_0React::TextInputAccessoryVisibilityMode mode);

UIKeyboardType ABI49_0_0RCTUIKeyboardTypeFromKeyboardType(ABI49_0_0facebook::ABI49_0_0React::KeyboardType keyboardType);

UIReturnKeyType ABI49_0_0RCTUIReturnKeyTypeFromReturnKeyType(ABI49_0_0facebook::ABI49_0_0React::ReturnKeyType returnKeyType);

UITextContentType ABI49_0_0RCTUITextContentTypeFromString(std::string const &contentType);

UITextInputPasswordRules *ABI49_0_0RCTUITextInputPasswordRulesFromString(std::string const &passwordRules);

NS_ASSUME_NONNULL_END
