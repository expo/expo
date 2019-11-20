/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI36_0_0RNSVGSolidColorBrush.h"

#import "ABI36_0_0RCTConvert+RNSVG.h"
#import <ABI36_0_0React/ABI36_0_0RCTLog.h>

@implementation ABI36_0_0RNSVGSolidColorBrush
{
    CGColorRef _color;
}

- (instancetype)initWithArray:(NSArray<ABI36_0_0RNSVGLength *> *)array
{
    if ((self = [super initWithArray:array])) {
        _color = CGColorRetain([ABI36_0_0RCTConvert ABI36_0_0RNSVGCGColor:array offset:1]);
    }
    return self;
}

- (void)dealloc
{
    CGColorRelease(_color);
}

- (BOOL)applyFillColor:(CGContextRef)context opacity:(CGFloat)opacity
{
    CGColorRef color = CGColorCreateCopyWithAlpha(_color, opacity * CGColorGetAlpha(_color));
    CGContextSetFillColorWithColor(context, color);
    CGColorRelease(color);
    return YES;
}

- (BOOL)applyStrokeColor:(CGContextRef)context opacity:(CGFloat)opacity
{
    CGColorRef color = CGColorCreateCopyWithAlpha(_color, opacity * CGColorGetAlpha(_color));
    CGContextSetStrokeColorWithColor(context, color);
    CGColorRelease(color);
    return YES;
}

@end
