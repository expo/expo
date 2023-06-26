/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#include <ABI49_0_0React/renderer/attributedstring/ABI49_0_0AttributedString.h>
#include <ABI49_0_0React/renderer/attributedstring/ABI49_0_0AttributedStringBox.h>
#include <ABI49_0_0React/renderer/attributedstring/ABI49_0_0TextAttributes.h>

NS_ASSUME_NONNULL_BEGIN

NSString *const ABI49_0_0RCTAttributedStringIsHighlightedAttributeName = @"IsHighlighted";
NSString *const ABI49_0_0RCTAttributedStringEventEmitterKey = @"EventEmitter";
NSString *const ABI49_0_0RCTTextAttributesAccessibilityRoleAttributeName = @"AccessibilityRole";

/*
 * Creates `NSTextAttributes` from given `ABI49_0_0facebook::ABI49_0_0React::TextAttributes`
 */
NSDictionary<NSAttributedStringKey, id> *ABI49_0_0RCTNSTextAttributesFromTextAttributes(
    ABI49_0_0facebook::ABI49_0_0React::TextAttributes const &textAttributes);

/*
 * Conversions amond `NSAttributedString`, `AttributedString` and `AttributedStringBox`.
 */
NSAttributedString *ABI49_0_0RCTNSAttributedStringFromAttributedString(
    ABI49_0_0facebook::ABI49_0_0React::AttributedString const &attributedString);

NSAttributedString *ABI49_0_0RCTNSAttributedStringFromAttributedStringBox(
    ABI49_0_0facebook::ABI49_0_0React::AttributedStringBox const &attributedStringBox);

ABI49_0_0facebook::ABI49_0_0React::AttributedStringBox ABI49_0_0RCTAttributedStringBoxFromNSAttributedString(
    NSAttributedString *nsAttributedString);

NSString *ABI49_0_0RCTNSStringFromStringApplyingTextTransform(NSString *string, ABI49_0_0facebook::ABI49_0_0React::TextTransform textTransform);

@interface ABI49_0_0RCTWeakEventEmitterWrapper : NSObject
@property (nonatomic, assign) ABI49_0_0facebook::ABI49_0_0React::SharedEventEmitter eventEmitter;
@end

NS_ASSUME_NONNULL_END
