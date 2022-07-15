/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#include <ABI46_0_0React/ABI46_0_0renderer/attributedstring/AttributedString.h>
#include <ABI46_0_0React/ABI46_0_0renderer/attributedstring/AttributedStringBox.h>
#include <ABI46_0_0React/ABI46_0_0renderer/attributedstring/TextAttributes.h>

NS_ASSUME_NONNULL_BEGIN

NSString *const ABI46_0_0RCTAttributedStringIsHighlightedAttributeName = @"IsHighlighted";
NSString *const ABI46_0_0RCTAttributedStringEventEmitterKey = @"EventEmitter";
NSString *const ABI46_0_0RCTTextAttributesAccessibilityRoleAttributeName = @"AccessibilityRole";

/*
 * Creates `NSTextAttributes` from given `ABI46_0_0facebook::ABI46_0_0React::TextAttributes`
 */
NSDictionary<NSAttributedStringKey, id> *ABI46_0_0RCTNSTextAttributesFromTextAttributes(
    ABI46_0_0facebook::ABI46_0_0React::TextAttributes const &textAttributes);

/*
 * Conversions amond `NSAttributedString`, `AttributedString` and `AttributedStringBox`.
 */
NSAttributedString *ABI46_0_0RCTNSAttributedStringFromAttributedString(
    ABI46_0_0facebook::ABI46_0_0React::AttributedString const &attributedString);

NSAttributedString *ABI46_0_0RCTNSAttributedStringFromAttributedStringBox(
    ABI46_0_0facebook::ABI46_0_0React::AttributedStringBox const &attributedStringBox);

ABI46_0_0facebook::ABI46_0_0React::AttributedStringBox ABI46_0_0RCTAttributedStringBoxFromNSAttributedString(
    NSAttributedString *nsAttributedString);

NSString *ABI46_0_0RCTNSStringFromStringApplyingTextTransform(NSString *string, ABI46_0_0facebook::ABI46_0_0React::TextTransform textTransform);

@interface ABI46_0_0RCTWeakEventEmitterWrapper : NSObject
@property (nonatomic, assign) ABI46_0_0facebook::ABI46_0_0React::SharedEventEmitter eventEmitter;
@end

NS_ASSUME_NONNULL_END
