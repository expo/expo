/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#include <ABI40_0_0React/attributedstring/AttributedString.h>
#include <ABI40_0_0React/attributedstring/AttributedStringBox.h>
#include <ABI40_0_0React/attributedstring/TextAttributes.h>

NS_ASSUME_NONNULL_BEGIN

NSString *const ABI40_0_0RCTAttributedStringIsHighlightedAttributeName = @"IsHighlighted";
NSString *const ABI40_0_0RCTAttributedStringEventEmitterKey = @"EventEmitter";

/*
 * Creates `NSTextAttributes` from given `ABI40_0_0facebook::ABI40_0_0React::TextAttributes`
 */
NSDictionary<NSAttributedStringKey, id> *ABI40_0_0RCTNSTextAttributesFromTextAttributes(
    ABI40_0_0facebook::ABI40_0_0React::TextAttributes const &textAttributes);

/*
 * Conversions amond `NSAttributedString`, `AttributedString` and `AttributedStringBox`.
 */
NSAttributedString *ABI40_0_0RCTNSAttributedStringFromAttributedString(
    ABI40_0_0facebook::ABI40_0_0React::AttributedString const &attributedString);

NSAttributedString *ABI40_0_0RCTNSAttributedStringFromAttributedStringBox(
    ABI40_0_0facebook::ABI40_0_0React::AttributedStringBox const &attributedStringBox);

ABI40_0_0facebook::ABI40_0_0React::AttributedStringBox ABI40_0_0RCTAttributedStringBoxFromNSAttributedString(
    NSAttributedString *nsAttributedString);

@interface ABI40_0_0RCTWeakEventEmitterWrapper : NSObject
@property (nonatomic, assign) ABI40_0_0facebook::ABI40_0_0React::SharedEventEmitter eventEmitter;
@end

NS_ASSUME_NONNULL_END
