/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#include <ABI39_0_0React/attributedstring/AttributedString.h>
#include <ABI39_0_0React/attributedstring/AttributedStringBox.h>
#include <ABI39_0_0React/attributedstring/TextAttributes.h>

NS_ASSUME_NONNULL_BEGIN

NSString *const ABI39_0_0RCTAttributedStringIsHighlightedAttributeName = @"IsHighlighted";
NSString *const ABI39_0_0RCTAttributedStringEventEmitterKey = @"EventEmitter";

/*
 * Creates `NSTextAttributes` from given `ABI39_0_0facebook::ABI39_0_0React::TextAttributes`
 */
NSDictionary<NSAttributedStringKey, id> *ABI39_0_0RCTNSTextAttributesFromTextAttributes(
    ABI39_0_0facebook::ABI39_0_0React::TextAttributes const &textAttributes);

/*
 * Conversions amond `NSAttributedString`, `AttributedString` and `AttributedStringBox`.
 */
NSAttributedString *ABI39_0_0RCTNSAttributedStringFromAttributedString(
    ABI39_0_0facebook::ABI39_0_0React::AttributedString const &attributedString);

NSAttributedString *ABI39_0_0RCTNSAttributedStringFromAttributedStringBox(
    ABI39_0_0facebook::ABI39_0_0React::AttributedStringBox const &attributedStringBox);

ABI39_0_0facebook::ABI39_0_0React::AttributedStringBox ABI39_0_0RCTAttributedStringBoxFromNSAttributedString(
    NSAttributedString *nsAttributedString);

@interface ABI39_0_0RCTWeakEventEmitterWrapper : NSObject
@property (nonatomic, assign) ABI39_0_0facebook::ABI39_0_0React::SharedEventEmitter eventEmitter;
@end

NS_ASSUME_NONNULL_END
