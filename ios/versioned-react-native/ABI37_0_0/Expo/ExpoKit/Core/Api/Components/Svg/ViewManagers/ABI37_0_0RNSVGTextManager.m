/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI37_0_0RNSVGTextManager.h"

#import "ABI37_0_0RNSVGText.h"
#import "ABI37_0_0RCTConvert+RNSVG.h"

@implementation ABI37_0_0RNSVGTextManager

ABI37_0_0RCT_EXPORT_MODULE()

- (ABI37_0_0RNSVGRenderable *)node
{
  return [ABI37_0_0RNSVGText new];
}

ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(textAnchor, ABI37_0_0RNSVGTextAnchor)
ABI37_0_0RCT_CUSTOM_VIEW_PROPERTY(dx, id, ABI37_0_0RNSVGText)
{
    view.deltaX = [ABI37_0_0RCTConvert ABI37_0_0RNSVGLengthArray:json];
}
ABI37_0_0RCT_CUSTOM_VIEW_PROPERTY(dy, id, ABI37_0_0RNSVGText)
{
    view.deltaY = [ABI37_0_0RCTConvert ABI37_0_0RNSVGLengthArray:json];
}
ABI37_0_0RCT_CUSTOM_VIEW_PROPERTY(positionX, id, ABI37_0_0RNSVGText)
{
    view.positionX = [ABI37_0_0RCTConvert ABI37_0_0RNSVGLengthArray:json];
}

ABI37_0_0RCT_CUSTOM_VIEW_PROPERTY(positionY, id, ABI37_0_0RNSVGText)
{
    view.positionY = [ABI37_0_0RCTConvert ABI37_0_0RNSVGLengthArray:json];
}
ABI37_0_0RCT_CUSTOM_VIEW_PROPERTY(x, id, ABI37_0_0RNSVGText)
{
    view.positionX = [ABI37_0_0RCTConvert ABI37_0_0RNSVGLengthArray:json];
}

ABI37_0_0RCT_CUSTOM_VIEW_PROPERTY(y, id, ABI37_0_0RNSVGText)
{
    view.positionY = [ABI37_0_0RCTConvert ABI37_0_0RNSVGLengthArray:json];
}
ABI37_0_0RCT_CUSTOM_VIEW_PROPERTY(rotate, id, ABI37_0_0RNSVGText)
{
    view.rotate = [ABI37_0_0RCTConvert ABI37_0_0RNSVGLengthArray:json];
}
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(font, NSDictionary)
ABI37_0_0RCT_CUSTOM_VIEW_PROPERTY(inlineSize, id, ABI37_0_0RNSVGText)
{
    view.inlineSize = [ABI37_0_0RCTConvert ABI37_0_0RNSVGLength:json];
}
ABI37_0_0RCT_CUSTOM_VIEW_PROPERTY(textLength, id, ABI37_0_0RNSVGText)
{
    view.textLength = [ABI37_0_0RCTConvert ABI37_0_0RNSVGLength:json];
}
ABI37_0_0RCT_CUSTOM_VIEW_PROPERTY(baselineShift, id, ABI37_0_0RNSVGText)
{
    if ([json isKindOfClass:[NSString class]]) {
        NSString *stringValue = (NSString *)json;
        view.baselineShift = stringValue;
    } else {
        view.baselineShift = [NSString stringWithFormat:@"%f", [json doubleValue]];
    }
}
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(lengthAdjust, NSString)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(alignmentBaseline, NSString)

ABI37_0_0RCT_CUSTOM_VIEW_PROPERTY(fontSize, id, ABI37_0_0RNSVGText)
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

ABI37_0_0RCT_CUSTOM_VIEW_PROPERTY(fontWeight, id, ABI37_0_0RNSVGText)
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
