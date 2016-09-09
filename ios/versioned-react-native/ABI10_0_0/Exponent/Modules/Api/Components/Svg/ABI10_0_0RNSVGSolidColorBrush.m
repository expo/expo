/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI10_0_0RNSVGSolidColorBrush.h"

#import "ABI10_0_0RCTConvert+RNSVG.h"
#import "ABI10_0_0RCTLog.h"

@implementation ABI10_0_0RNSVGSolidColorBrush
{
    CGColorRef _color;
}

- (instancetype)initWithArray:(NSArray<NSNumber *> *)array
{
    if ((self = [super initWithArray:array])) {
        _color = CGColorRetain([ABI10_0_0RCTConvert CGColor:array offset:1]);
    }
    return self;
}

- (void)dealloc
{
    CGColorRelease(_color);
}

- (BOOL)applyFillColor:(CGContextRef)context opacity:(CGFloat)opacity
{
    CGFloat aplpha = CGColorGetAlpha(_color);
    CGColorRef color = CGColorCreateCopyWithAlpha(_color, opacity * aplpha);
    CGContextSetFillColorWithColor(context, color);
    CGColorRelease(color);
    return YES;
}

- (BOOL)applyStrokeColor:(CGContextRef)context opacity:(CGFloat)opacity
{
    CGFloat aplpha = CGColorGetAlpha(_color);
    CGColorRef color = CGColorCreateCopyWithAlpha(_color, opacity * aplpha);
    CGContextSetStrokeColorWithColor(context, color);
    CGColorRelease(color);
    return YES;
}

@end
