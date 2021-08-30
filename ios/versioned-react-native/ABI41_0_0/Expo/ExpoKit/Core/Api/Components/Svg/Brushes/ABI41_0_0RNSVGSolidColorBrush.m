/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI41_0_0RNSVGSolidColorBrush.h"

#import "ABI41_0_0RCTConvert+RNSVG.h"
#import <ABI41_0_0React/ABI41_0_0RCTLog.h>

@implementation ABI41_0_0RNSVGSolidColorBrush
{
    CGColorRef _color;
}

- (instancetype)initWithArray:(NSArray<ABI41_0_0RNSVGLength *> *)array
{
    if ((self = [super initWithArray:array])) {
        _color = CGColorRetain([ABI41_0_0RCTConvert ABI41_0_0RNSVGCGColor:array offset:1]);
    }
    return self;
}

- (instancetype)initWithNumber:(NSNumber *)number
{
    if ((self = [super init])) {
        _color = CGColorRetain([ABI41_0_0RCTConvert CGColor:number]);
    }
    return self;
}

- (void)dealloc
{
    CGColorRelease(_color);
}

- (CGColorRef)getColorWithOpacity:(CGFloat)opacity
{
    return CGColorCreateCopyWithAlpha(_color, opacity * CGColorGetAlpha(_color));
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
