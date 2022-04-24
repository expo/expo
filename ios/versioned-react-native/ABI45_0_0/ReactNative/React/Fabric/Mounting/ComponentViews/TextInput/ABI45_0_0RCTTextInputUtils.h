/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI45_0_0React/ABI45_0_0RCTBackedTextInputViewProtocol.h>
#import <butter/optional.h>
#import <ABI45_0_0React/ABI45_0_0renderer/components/iostextinput/primitives.h>

NS_ASSUME_NONNULL_BEGIN

void ABI45_0_0RCTCopyBackedTextInput(
    UIView<ABI45_0_0RCTBackedTextInputViewProtocol> *fromTextInput,
    UIView<ABI45_0_0RCTBackedTextInputViewProtocol> *toTextInput);

UITextAutocorrectionType ABI45_0_0RCTUITextAutocorrectionTypeFromOptionalBool(ABI45_0_0facebook::butter::optional<bool> autoCorrect);

UITextAutocapitalizationType ABI45_0_0RCTUITextAutocapitalizationTypeFromAutocapitalizationType(
    ABI45_0_0facebook::ABI45_0_0React::AutocapitalizationType autocapitalizationType);

UIKeyboardAppearance ABI45_0_0RCTUIKeyboardAppearanceFromKeyboardAppearance(
    ABI45_0_0facebook::ABI45_0_0React::KeyboardAppearance keyboardAppearance);

UITextSpellCheckingType ABI45_0_0RCTUITextSpellCheckingTypeFromOptionalBool(ABI45_0_0facebook::butter::optional<bool> spellCheck);

UITextFieldViewMode ABI45_0_0RCTUITextFieldViewModeFromTextInputAccessoryVisibilityMode(
    ABI45_0_0facebook::ABI45_0_0React::TextInputAccessoryVisibilityMode mode);

UIKeyboardType ABI45_0_0RCTUIKeyboardTypeFromKeyboardType(ABI45_0_0facebook::ABI45_0_0React::KeyboardType keyboardType);

UIReturnKeyType ABI45_0_0RCTUIReturnKeyTypeFromReturnKeyType(ABI45_0_0facebook::ABI45_0_0React::ReturnKeyType returnKeyType);

API_AVAILABLE(ios(10.0))
UITextContentType ABI45_0_0RCTUITextContentTypeFromString(std::string const &contentType);

API_AVAILABLE(ios(12.0))
UITextInputPasswordRules *ABI45_0_0RCTUITextInputPasswordRulesFromString(std::string const &passwordRules);

NS_ASSUME_NONNULL_END
