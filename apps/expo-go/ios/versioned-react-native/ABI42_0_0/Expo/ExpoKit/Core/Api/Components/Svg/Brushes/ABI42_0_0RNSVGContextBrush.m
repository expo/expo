/**
 * Copyright (c) 2015-present, ABI42_0_0React-native-community.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI42_0_0RNSVGContextBrush.h"
#import "ABI42_0_0RNSVGRenderable.h"
#import "ABI42_0_0RNSVGNode.h"

#import "ABI42_0_0RCTConvert+RNSVG.h"
#import <ABI42_0_0React/ABI42_0_0RCTLog.h>

@implementation ABI42_0_0RNSVGContextBrush
{
    BOOL _isStroke;
}

- (instancetype)initFill
{
    if ((self = [super initWithArray:nil])) {
        _isStroke = NO;
    }
    return self;
}

- (instancetype)initStroke
{
    if ((self = [super initWithArray:nil])) {
        _isStroke = YES;
    }
    return self;
}

- (void)dealloc
{
}

- (BOOL)applyFillColor:(CGContextRef)context opacity:(CGFloat)opacity
{
    ABI42_0_0RNSVGRenderable *element = ABI42_0_0RNSVGRenderable.contextElement;
    if (!element) {
        return NO;
    }

    ABI42_0_0RNSVGBrush *brush = _isStroke ? element.stroke : element.fill;

    BOOL fillColor;

    if (brush.class == ABI42_0_0RNSVGBrush.class) {
        CGContextSetFillColorWithColor(context, [element.tintColor CGColor]);
        fillColor = YES;
    } else {
        fillColor = [brush applyFillColor:context opacity:opacity];
    }

    return fillColor;
}



- (BOOL)applyStrokeColor:(CGContextRef)context opacity:(CGFloat)opacity
{
    ABI42_0_0RNSVGRenderable *element = ABI42_0_0RNSVGRenderable.contextElement;
    if (!element) {
        return NO;
    }

    ABI42_0_0RNSVGBrush *brush = _isStroke ? element.stroke : element.fill;

    BOOL strokeColor;

    if (brush.class == ABI42_0_0RNSVGBrush.class) {
        CGContextSetStrokeColorWithColor(context, [element.tintColor CGColor]);
        strokeColor = YES;
    } else {
        strokeColor = [brush applyStrokeColor:context opacity:opacity];
    }

    return YES;
}

@end
