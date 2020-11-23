/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI40_0_0RNSVGTextManager.h"

#import "ABI40_0_0RNSVGText.h"
#import "ABI40_0_0RCTConvert+RNSVG.h"

@implementation ABI40_0_0RNSVGTextManager

ABI40_0_0RCT_EXPORT_MODULE()

- (ABI40_0_0RNSVGRenderable *)node
{
  return [ABI40_0_0RNSVGText new];
}

ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(textAnchor, ABI40_0_0RNSVGTextAnchor)
ABI40_0_0RCT_CUSTOM_VIEW_PROPERTY(dx, id, ABI40_0_0RNSVGText)
{
    view.deltaX = [ABI40_0_0RCTConvert ABI40_0_0RNSVGLengthArray:json];
}
ABI40_0_0RCT_CUSTOM_VIEW_PROPERTY(dy, id, ABI40_0_0RNSVGText)
{
    view.deltaY = [ABI40_0_0RCTConvert ABI40_0_0RNSVGLengthArray:json];
}
ABI40_0_0RCT_CUSTOM_VIEW_PROPERTY(positionX, id, ABI40_0_0RNSVGText)
{
    view.positionX = [ABI40_0_0RCTConvert ABI40_0_0RNSVGLengthArray:json];
}

ABI40_0_0RCT_CUSTOM_VIEW_PROPERTY(positionY, id, ABI40_0_0RNSVGText)
{
    view.positionY = [ABI40_0_0RCTConvert ABI40_0_0RNSVGLengthArray:json];
}
ABI40_0_0RCT_CUSTOM_VIEW_PROPERTY(x, id, ABI40_0_0RNSVGText)
{
    view.positionX = [ABI40_0_0RCTConvert ABI40_0_0RNSVGLengthArray:json];
}

ABI40_0_0RCT_CUSTOM_VIEW_PROPERTY(y, id, ABI40_0_0RNSVGText)
{
    view.positionY = [ABI40_0_0RCTConvert ABI40_0_0RNSVGLengthArray:json];
}
ABI40_0_0RCT_CUSTOM_VIEW_PROPERTY(rotate, id, ABI40_0_0RNSVGText)
{
    view.rotate = [ABI40_0_0RCTConvert ABI40_0_0RNSVGLengthArray:json];
}
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(font, NSDictionary)
ABI40_0_0RCT_CUSTOM_VIEW_PROPERTY(inlineSize, id, ABI40_0_0RNSVGText)
{
    view.inlineSize = [ABI40_0_0RCTConvert ABI40_0_0RNSVGLength:json];
}
ABI40_0_0RCT_CUSTOM_VIEW_PROPERTY(textLength, id, ABI40_0_0RNSVGText)
{
    view.textLength = [ABI40_0_0RCTConvert ABI40_0_0RNSVGLength:json];
}
ABI40_0_0RCT_CUSTOM_VIEW_PROPERTY(baselineShift, id, ABI40_0_0RNSVGText)
{
    if ([json isKindOfClass:[NSString class]]) {
        NSString *stringValue = (NSString *)json;
        view.baselineShift = stringValue;
    } else {
        view.baselineShift = [NSString stringWithFormat:@"%f", [json doubleValue]];
    }
}
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(lengthAdjust, NSString)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(alignmentBaseline, NSString)

ABI40_0_0RCT_CUSTOM_VIEW_PROPERTY(fontSize, id, ABI40_0_0RNSVGText)
{
    if ([json isKindOfClass:[NSString class]]) {
        NSString *stringValue = (NSString *)json;
        view.font = @{ @"fontSize": stringValue };
    } else {
        NSNumber* number = (NSNumber*)json;
        double num = [number doubleValue];
        view.font = @{@"fontSize": [NSNumber numberWithDouble:num] };
    }
}

ABI40_0_0RCT_CUSTOM_VIEW_PROPERTY(fontWeight, id, ABI40_0_0RNSVGText)
{
    if ([json isKindOfClass:[NSString class]]) {
        NSString *stringValue = (NSString *)json;
        view.font = @{ @"fontWeight": stringValue };
    } else {
        NSNumber* number = (NSNumber*)json;
        double num = [number doubleValue];
        view.font = @{@"fontWeight": [NSNumber numberWithDouble:num] };
    }
}

@end
