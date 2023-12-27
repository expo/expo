/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#include <ABI44_0_0React/ABI44_0_0renderer/attributedstring/AttributedString.h>
#include <ABI44_0_0React/ABI44_0_0renderer/attributedstring/AttributedStringBox.h>
#include <ABI44_0_0React/ABI44_0_0renderer/attributedstring/TextAttributes.h>

NS_ASSUME_NONNULL_BEGIN

NSString *const ABI44_0_0RCTAttributedStringIsHighlightedAttributeName = @"IsHighlighted";
NSString *const ABI44_0_0RCTAttributedStringEventEmitterKey = @"EventEmitter";
NSString *const ABI44_0_0RCTTextAttributesAccessibilityRoleAttributeName = @"AccessibilityRole";

/*
 * Creates `NSTextAttributes` from given `ABI44_0_0facebook::ABI44_0_0React::TextAttributes`
 */
NSDictionary<NSAttributedStringKey, id> *ABI44_0_0RCTNSTextAttributesFromTextAttributes(
    ABI44_0_0facebook::ABI44_0_0React::TextAttributes const &textAttributes);

/*
 * Conversions amond `NSAttributedString`, `AttributedString` and `AttributedStringBox`.
 */
NSAttributedString *ABI44_0_0RCTNSAttributedStringFromAttributedString(
    ABI44_0_0facebook::ABI44_0_0React::AttributedString const &attributedString);

NSAttributedString *ABI44_0_0RCTNSAttributedStringFromAttributedStringBox(
    ABI44_0_0facebook::ABI44_0_0React::AttributedStringBox const &attributedStringBox);

ABI44_0_0facebook::ABI44_0_0React::AttributedStringBox ABI44_0_0RCTAttributedStringBoxFromNSAttributedString(
    NSAttributedString *nsAttributedString);

@interface ABI44_0_0RCTWeakEventEmitterWrapper : NSObject
@property (nonatomic, assign) ABI44_0_0facebook::ABI44_0_0React::SharedEventEmitter eventEmitter;
@end

NS_ASSUME_NONNULL_END
