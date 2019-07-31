/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#include <ABI31_0_0fabric/ABI31_0_0attributedstring/AttributedString.h>
#include <ABI31_0_0fabric/ABI31_0_0attributedstring/TextAttributes.h>

NS_ASSUME_NONNULL_BEGIN

NSString *const ABI31_0_0RCTAttributedStringIsHighlightedAttributeName = @"IsHighlighted";
NSString *const ABI31_0_0RCTAttributedStringReactABI31_0_0TagAttributeName = @"ReactABI31_0_0Tag";

/**
 * Constructs ready-to-render `NSAttributedString` by given `AttributedString`.
 */
NSAttributedString *ABI31_0_0RCTNSAttributedStringFromAttributedString(const facebook::ReactABI31_0_0::AttributedString &attributedString);

NS_ASSUME_NONNULL_END
