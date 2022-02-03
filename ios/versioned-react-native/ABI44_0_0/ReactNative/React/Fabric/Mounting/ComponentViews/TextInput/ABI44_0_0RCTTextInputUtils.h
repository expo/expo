/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI44_0_0React/ABI44_0_0RCTBackedTextInputViewProtocol.h>
#import <better/optional.h>
#import <ABI44_0_0React/ABI44_0_0renderer/components/iostextinput/primitives.h>

NS_ASSUME_NONNULL_BEGIN

void ABI44_0_0RCTCopyBackedTextInput(
    UIView<ABI44_0_0RCTBackedTextInputViewProtocol> *fromTextInput,
    UIView<ABI44_0_0RCTBackedTextInputViewProtocol> *toTextInput);

UITextAutocorrectionType ABI44_0_0RCTUITextAutocorrectionTypeFromOptionalBool(ABI44_0_0facebook::better::optional<bool> autoCorrect);

UITextAutocapitalizationType ABI44_0_0RCTUITextAutocapitalizationTypeFromAutocapitalizationType(
    ABI44_0_0facebook::ABI44_0_0React::AutocapitalizationType autocapitalizationType);

UIKeyboardAppearance ABI44_0_0RCTUIKeyboardAppearanceFromKeyboardAppearance(
    ABI44_0_0facebook::ABI44_0_0React::KeyboardAppearance keyboardAppearance);

UITextSpellCheckingType ABI44_0_0RCTUITextSpellCheckingTypeFromOptionalBool(ABI44_0_0facebook::better::optional<bool> spellCheck);

UITextFieldViewMode ABI44_0_0RCTUITextFieldViewModeFromTextInputAccessoryVisibilityMode(
    ABI44_0_0facebook::ABI44_0_0React::TextInputAccessoryVisibilityMode mode);

UIKeyboardType ABI44_0_0RCTUIKeyboardTypeFromKeyboardType(ABI44_0_0facebook::ABI44_0_0React::KeyboardType keyboardType);

UIReturnKeyType ABI44_0_0RCTUIReturnKeyTypeFromReturnKeyType(ABI44_0_0facebook::ABI44_0_0React::ReturnKeyType returnKeyType);

API_AVAILABLE(ios(10.0))
UITextContentType ABI44_0_0RCTUITextContentTypeFromString(std::string const &contentType);

API_AVAILABLE(ios(12.0))
UITextInputPasswordRules *ABI44_0_0RCTUITextInputPasswordRulesFromString(std::string const &passwordRules);

NS_ASSUME_NONNULL_END
