/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI44_0_0RNSVGTextManager.h"

#import "ABI44_0_0RNSVGText.h"
#import "ABI44_0_0RCTConvert+RNSVG.h"

@implementation ABI44_0_0RNSVGTextManager

ABI44_0_0RCT_EXPORT_MODULE()

- (ABI44_0_0RNSVGRenderable *)node
{
  return [ABI44_0_0RNSVGText new];
}

ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(textAnchor, ABI44_0_0RNSVGTextAnchor)
ABI44_0_0RCT_CUSTOM_VIEW_PROPERTY(dx, id, ABI44_0_0RNSVGText)
{
    view.deltaX = [ABI44_0_0RCTConvert ABI44_0_0RNSVGLengthArray:json];
}
ABI44_0_0RCT_CUSTOM_VIEW_PROPERTY(dy, id, ABI44_0_0RNSVGText)
{
    view.deltaY = [ABI44_0_0RCTConvert ABI44_0_0RNSVGLengthArray:json];
}
ABI44_0_0RCT_CUSTOM_VIEW_PROPERTY(positionX, id, ABI44_0_0RNSVGText)
{
    view.positionX = [ABI44_0_0RCTConvert ABI44_0_0RNSVGLengthArray:json];
}

ABI44_0_0RCT_CUSTOM_VIEW_PROPERTY(positionY, id, ABI44_0_0RNSVGText)
{
    view.positionY = [ABI44_0_0RCTConvert ABI44_0_0RNSVGLengthArray:json];
}
ABI44_0_0RCT_CUSTOM_VIEW_PROPERTY(x, id, ABI44_0_0RNSVGText)
{
    view.positionX = [ABI44_0_0RCTConvert ABI44_0_0RNSVGLengthArray:json];
}

ABI44_0_0RCT_CUSTOM_VIEW_PROPERTY(y, id, ABI44_0_0RNSVGText)
{
    view.positionY = [ABI44_0_0RCTConvert ABI44_0_0RNSVGLengthArray:json];
}
ABI44_0_0RCT_CUSTOM_VIEW_PROPERTY(rotate, id, ABI44_0_0RNSVGText)
{
    view.rotate = [ABI44_0_0RCTConvert ABI44_0_0RNSVGLengthArray:json];
}
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(font, NSDictionary)
ABI44_0_0RCT_CUSTOM_VIEW_PROPERTY(inlineSize, id, ABI44_0_0RNSVGText)
{
    view.inlineSize = [ABI44_0_0RCTConvert ABI44_0_0RNSVGLength:json];
}
ABI44_0_0RCT_CUSTOM_VIEW_PROPERTY(textLength, id, ABI44_0_0RNSVGText)
{
    view.textLength = [ABI44_0_0RCTConvert ABI44_0_0RNSVGLength:json];
}
ABI44_0_0RCT_CUSTOM_VIEW_PROPERTY(baselineShift, id, ABI44_0_0RNSVGText)
{
    if ([json isKindOfClass:[NSString class]]) {
        NSString *stringValue = (NSString *)json;
        view.baselineShift = stringValue;
    } else {
        view.baselineShift = [NSString stringWithFormat:@"%f", [json doubleValue]];
    }
}
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(lengthAdjust, NSString)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(alignmentBaseline, NSString)

ABI44_0_0RCT_CUSTOM_VIEW_PROPERTY(fontSize, id, ABI44_0_0RNSVGText)
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

ABI44_0_0RCT_CUSTOM_VIEW_PROPERTY(fontWeight, id, ABI44_0_0RNSVGText)
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
