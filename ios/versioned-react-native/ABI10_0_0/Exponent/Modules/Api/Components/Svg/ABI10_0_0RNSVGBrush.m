/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI10_0_0RNSVGBrush.h"

#import "ABI10_0_0RCTDefines.h"

@implementation ABI10_0_0RNSVGBrush

- (instancetype)initWithArray:(NSArray *)data
{
    return [super init];
}

ABI10_0_0RCT_NOT_IMPLEMENTED(- (instancetype)init)

- (BOOL)applyFillColor:(CGContextRef)context opacity:(CGFloat)opacity
{
    return NO;
}

- (BOOL)applyStrokeColor:(CGContextRef)context opacity:(CGFloat)opacity
{
    return NO;
}

- (void)paint:(CGContextRef)context opacity:(CGFloat)opacity brushConverter:(ABI10_0_0RNSVGBrushConverter *)brushConverter
{
    // abstract
}
@end
