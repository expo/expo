/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#include <ABI42_0_0React/attributedstring/AttributedString.h>
#include <ABI42_0_0React/attributedstring/AttributedStringBox.h>
#include <ABI42_0_0React/attributedstring/TextAttributes.h>

NS_ASSUME_NONNULL_BEGIN

NSString *const ABI42_0_0RCTAttributedStringIsHighlightedAttributeName = @"IsHighlighted";
NSString *const ABI42_0_0RCTAttributedStringEventEmitterKey = @"EventEmitter";

/*
 * Creates `NSTextAttributes` from given `ABI42_0_0facebook::ABI42_0_0React::TextAttributes`
 */
NSDictionary<NSAttributedStringKey, id> *ABI42_0_0RCTNSTextAttributesFromTextAttributes(
    ABI42_0_0facebook::ABI42_0_0React::TextAttributes const &textAttributes);

/*
 * Conversions amond `NSAttributedString`, `AttributedString` and `AttributedStringBox`.
 */
NSAttributedString *ABI42_0_0RCTNSAttributedStringFromAttributedString(
    ABI42_0_0facebook::ABI42_0_0React::AttributedString const &attributedString);

NSAttributedString *ABI42_0_0RCTNSAttributedStringFromAttributedStringBox(
    ABI42_0_0facebook::ABI42_0_0React::AttributedStringBox const &attributedStringBox);

ABI42_0_0facebook::ABI42_0_0React::AttributedStringBox ABI42_0_0RCTAttributedStringBoxFromNSAttributedString(
    NSAttributedString *nsAttributedString);

@interface ABI42_0_0RCTWeakEventEmitterWrapper : NSObject
@property (nonatomic, assign) ABI42_0_0facebook::ABI42_0_0React::SharedEventEmitter eventEmitter;
@end

NS_ASSUME_NONNULL_END
