/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

@interface NSTextStorage (ABI27_0_0RCTFontScaling)

- (void)ABI27_0_0RCTscaleFontSizeToFitSize:(CGSize)size
               minimumFontSize:(CGFloat)minimumFontSize
               maximumFontSize:(CGFloat)maximumFontSize;

- (void)ABI27_0_0RCTscaleFontSizeWithRatio:(CGFloat)ratio
               minimumFontSize:(CGFloat)minimumFontSize
               maximumFontSize:(CGFloat)maximumFontSize;

@end
