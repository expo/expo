/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#include <ABI37_0_0React/attributedstring/AttributedString.h>
#include <ABI37_0_0React/attributedstring/TextAttributes.h>

NS_ASSUME_NONNULL_BEGIN

NSString *const ABI37_0_0RCTAttributedStringIsHighlightedAttributeName =
    @"IsHighlighted";
NSString *const ABI37_0_0RCTAttributedStringEventEmitterKey = @"EventEmitter";

/**
 * Constructs ready-to-render `NSAttributedString` by given `AttributedString`.
 */
NSAttributedString *ABI37_0_0RCTNSAttributedStringFromAttributedString(
    const ABI37_0_0facebook::ABI37_0_0React::AttributedString &attributedString);

@interface ABI37_0_0RCTWeakEventEmitterWrapper : NSObject
@property(nonatomic, assign) ABI37_0_0facebook::ABI37_0_0React::SharedEventEmitter eventEmitter;
@end

NS_ASSUME_NONNULL_END
