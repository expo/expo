/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#include <ReactABI35_0_0/attributedstring/AttributedString.h>
#include <ReactABI35_0_0/attributedstring/TextAttributes.h>

NS_ASSUME_NONNULL_BEGIN

NSString *const ABI35_0_0RCTAttributedStringIsHighlightedAttributeName =
    @"IsHighlighted";
NSString *const ABI35_0_0RCTAttributedStringEventEmitterKey = @"EventEmitter";

/**
 * Constructs ready-to-render `NSAttributedString` by given `AttributedString`.
 */
NSAttributedString *ABI35_0_0RCTNSAttributedStringFromAttributedString(
    const facebook::ReactABI35_0_0::AttributedString &attributedString);

@interface ABI35_0_0RCTWeakEventEmitterWrapper : NSObject
@property(nonatomic, assign) facebook::ReactABI35_0_0::SharedEventEmitter eventEmitter;
@end

NS_ASSUME_NONNULL_END
