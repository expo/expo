/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI42_0_0RNSVGTextManager.h"

#import "ABI42_0_0RNSVGText.h"
#import "ABI42_0_0RCTConvert+RNSVG.h"

@implementation ABI42_0_0RNSVGTextManager

ABI42_0_0RCT_EXPORT_MODULE()

- (ABI42_0_0RNSVGRenderable *)node
{
  return [ABI42_0_0RNSVGText new];
}

ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(textAnchor, ABI42_0_0RNSVGTextAnchor)
ABI42_0_0RCT_CUSTOM_VIEW_PROPERTY(dx, id, ABI42_0_0RNSVGText)
{
    view.deltaX = [ABI42_0_0RCTConvert ABI42_0_0RNSVGLengthArray:json];
}
ABI42_0_0RCT_CUSTOM_VIEW_PROPERTY(dy, id, ABI42_0_0RNSVGText)
{
    view.deltaY = [ABI42_0_0RCTConvert ABI42_0_0RNSVGLengthArray:json];
}
ABI42_0_0RCT_CUSTOM_VIEW_PROPERTY(positionX, id, ABI42_0_0RNSVGText)
{
    view.positionX = [ABI42_0_0RCTConvert ABI42_0_0RNSVGLengthArray:json];
}

ABI42_0_0RCT_CUSTOM_VIEW_PROPERTY(positionY, id, ABI42_0_0RNSVGText)
{
    view.positionY = [ABI42_0_0RCTConvert ABI42_0_0RNSVGLengthArray:json];
}
ABI42_0_0RCT_CUSTOM_VIEW_PROPERTY(x, id, ABI42_0_0RNSVGText)
{
    view.positionX = [ABI42_0_0RCTConvert ABI42_0_0RNSVGLengthArray:json];
}

ABI42_0_0RCT_CUSTOM_VIEW_PROPERTY(y, id, ABI42_0_0RNSVGText)
{
    view.positionY = [ABI42_0_0RCTConvert ABI42_0_0RNSVGLengthArray:json];
}
ABI42_0_0RCT_CUSTOM_VIEW_PROPERTY(rotate, id, ABI42_0_0RNSVGText)
{
    view.rotate = [ABI42_0_0RCTConvert ABI42_0_0RNSVGLengthArray:json];
}
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(font, NSDictionary)
ABI42_0_0RCT_CUSTOM_VIEW_PROPERTY(inlineSize, id, ABI42_0_0RNSVGText)
{
    view.inlineSize = [ABI42_0_0RCTConvert ABI42_0_0RNSVGLength:json];
}
ABI42_0_0RCT_CUSTOM_VIEW_PROPERTY(textLength, id, ABI42_0_0RNSVGText)
{
    view.textLength = [ABI42_0_0RCTConvert ABI42_0_0RNSVGLength:json];
}
ABI42_0_0RCT_CUSTOM_VIEW_PROPERTY(baselineShift, id, ABI42_0_0RNSVGText)
{
    if ([json isKindOfClass:[NSString class]]) {
        NSString *stringValue = (NSString *)json;
        view.baselineShift = stringValue;
    } else {
        view.baselineShift = [NSString stringWithFormat:@"%f", [json doubleValue]];
    }
}
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(lengthAdjust, NSString)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(alignmentBaseline, NSString)

ABI42_0_0RCT_CUSTOM_VIEW_PROPERTY(fontSize, id, ABI42_0_0RNSVGText)
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

ABI42_0_0RCT_CUSTOM_VIEW_PROPERTY(fontWeight, id, ABI42_0_0RNSVGText)
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
