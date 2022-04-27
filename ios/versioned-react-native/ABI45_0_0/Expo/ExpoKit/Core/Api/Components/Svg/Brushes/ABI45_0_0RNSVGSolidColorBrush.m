/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI45_0_0RNSVGSolidColorBrush.h"
#import "ABI45_0_0RNSVGUIKit.h"

#import "ABI45_0_0RCTConvert+RNSVG.h"
#import <ABI45_0_0React/ABI45_0_0RCTLog.h>

@implementation ABI45_0_0RNSVGSolidColorBrush
{
    ABI45_0_0RNSVGColor *_color;
}

- (instancetype)initWithArray:(NSArray<ABI45_0_0RNSVGLength *> *)array
{
    if ((self = [super initWithArray:array])) {
        _color = [ABI45_0_0RCTConvert ABI45_0_0RNSVGColor:array offset:1];
    }
    return self;
}

- (instancetype)initWithNumber:(NSNumber *)number
{
    if ((self = [super init])) {
        _color = [ABI45_0_0RCTConvert ABI45_0_0RNSVGColor:number];
    }
    return self;
}

- (void)dealloc
{
    _color = nil;
}

- (CGColorRef)getColorWithOpacity:(CGFloat)opacity
{
    CGColorRef baseColor = _color.CGColor;
    CGColorRef color = CGColorCreateCopyWithAlpha(baseColor, opacity * CGColorGetAlpha(baseColor));
    return color;
}

- (BOOL)applyFillColor:(CGContextRef)context opacity:(CGFloat)opacity
{
    CGColorRef color = [self getColorWithOpacity:opacity];
    CGContextSetFillColorWithColor(context, color);
    CGColorRelease(color);
    return YES;
}

- (BOOL)applyStrokeColor:(CGContextRef)context opacity:(CGFloat)opacity
{
    CGColorRef color = [self getColorWithOpacity:opacity];
    CGContextSetStrokeColorWithColor(context, color);
    CGColorRelease(color);
    return YES;
}

@end
