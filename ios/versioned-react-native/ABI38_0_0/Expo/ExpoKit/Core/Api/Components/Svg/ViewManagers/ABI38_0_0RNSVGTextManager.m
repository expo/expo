/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI38_0_0RNSVGTextManager.h"

#import "ABI38_0_0RNSVGText.h"
#import "ABI38_0_0RCTConvert+RNSVG.h"

@implementation ABI38_0_0RNSVGTextManager

ABI38_0_0RCT_EXPORT_MODULE()

- (ABI38_0_0RNSVGRenderable *)node
{
  return [ABI38_0_0RNSVGText new];
}

ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(textAnchor, ABI38_0_0RNSVGTextAnchor)
ABI38_0_0RCT_CUSTOM_VIEW_PROPERTY(dx, id, ABI38_0_0RNSVGText)
{
    view.deltaX = [ABI38_0_0RCTConvert ABI38_0_0RNSVGLengthArray:json];
}
ABI38_0_0RCT_CUSTOM_VIEW_PROPERTY(dy, id, ABI38_0_0RNSVGText)
{
    view.deltaY = [ABI38_0_0RCTConvert ABI38_0_0RNSVGLengthArray:json];
}
ABI38_0_0RCT_CUSTOM_VIEW_PROPERTY(positionX, id, ABI38_0_0RNSVGText)
{
    view.positionX = [ABI38_0_0RCTConvert ABI38_0_0RNSVGLengthArray:json];
}

ABI38_0_0RCT_CUSTOM_VIEW_PROPERTY(positionY, id, ABI38_0_0RNSVGText)
{
    view.positionY = [ABI38_0_0RCTConvert ABI38_0_0RNSVGLengthArray:json];
}
ABI38_0_0RCT_CUSTOM_VIEW_PROPERTY(x, id, ABI38_0_0RNSVGText)
{
    view.positionX = [ABI38_0_0RCTConvert ABI38_0_0RNSVGLengthArray:json];
}

ABI38_0_0RCT_CUSTOM_VIEW_PROPERTY(y, id, ABI38_0_0RNSVGText)
{
    view.positionY = [ABI38_0_0RCTConvert ABI38_0_0RNSVGLengthArray:json];
}
ABI38_0_0RCT_CUSTOM_VIEW_PROPERTY(rotate, id, ABI38_0_0RNSVGText)
{
    view.rotate = [ABI38_0_0RCTConvert ABI38_0_0RNSVGLengthArray:json];
}
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(font, NSDictionary)
ABI38_0_0RCT_CUSTOM_VIEW_PROPERTY(inlineSize, id, ABI38_0_0RNSVGText)
{
    view.inlineSize = [ABI38_0_0RCTConvert ABI38_0_0RNSVGLength:json];
}
ABI38_0_0RCT_CUSTOM_VIEW_PROPERTY(textLength, id, ABI38_0_0RNSVGText)
{
    view.textLength = [ABI38_0_0RCTConvert ABI38_0_0RNSVGLength:json];
}
ABI38_0_0RCT_CUSTOM_VIEW_PROPERTY(baselineShift, id, ABI38_0_0RNSVGText)
{
    if ([json isKindOfClass:[NSString class]]) {
        NSString *stringValue = (NSString *)json;
        view.baselineShift = stringValue;
    } else {
        view.baselineShift = [NSString stringWithFormat:@"%f", [json doubleValue]];
    }
}
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(lengthAdjust, NSString)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(alignmentBaseline, NSString)

ABI38_0_0RCT_CUSTOM_VIEW_PROPERTY(fontSize, id, ABI38_0_0RNSVGText)
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

ABI38_0_0RCT_CUSTOM_VIEW_PROPERTY(fontWeight, id, ABI38_0_0RNSVGText)
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
