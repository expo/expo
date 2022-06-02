/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI45_0_0RNSVGTextManager.h"

#import "ABI45_0_0RNSVGText.h"
#import "ABI45_0_0RCTConvert+RNSVG.h"

@implementation ABI45_0_0RNSVGTextManager

ABI45_0_0RCT_EXPORT_MODULE()

- (ABI45_0_0RNSVGRenderable *)node
{
  return [ABI45_0_0RNSVGText new];
}

ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(textAnchor, ABI45_0_0RNSVGTextAnchor)
ABI45_0_0RCT_CUSTOM_VIEW_PROPERTY(dx, id, ABI45_0_0RNSVGText)
{
    view.deltaX = [ABI45_0_0RCTConvert ABI45_0_0RNSVGLengthArray:json];
}
ABI45_0_0RCT_CUSTOM_VIEW_PROPERTY(dy, id, ABI45_0_0RNSVGText)
{
    view.deltaY = [ABI45_0_0RCTConvert ABI45_0_0RNSVGLengthArray:json];
}
ABI45_0_0RCT_CUSTOM_VIEW_PROPERTY(positionX, id, ABI45_0_0RNSVGText)
{
    view.positionX = [ABI45_0_0RCTConvert ABI45_0_0RNSVGLengthArray:json];
}

ABI45_0_0RCT_CUSTOM_VIEW_PROPERTY(positionY, id, ABI45_0_0RNSVGText)
{
    view.positionY = [ABI45_0_0RCTConvert ABI45_0_0RNSVGLengthArray:json];
}
ABI45_0_0RCT_CUSTOM_VIEW_PROPERTY(x, id, ABI45_0_0RNSVGText)
{
    view.positionX = [ABI45_0_0RCTConvert ABI45_0_0RNSVGLengthArray:json];
}

ABI45_0_0RCT_CUSTOM_VIEW_PROPERTY(y, id, ABI45_0_0RNSVGText)
{
    view.positionY = [ABI45_0_0RCTConvert ABI45_0_0RNSVGLengthArray:json];
}
ABI45_0_0RCT_CUSTOM_VIEW_PROPERTY(rotate, id, ABI45_0_0RNSVGText)
{
    view.rotate = [ABI45_0_0RCTConvert ABI45_0_0RNSVGLengthArray:json];
}
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(font, NSDictionary)
ABI45_0_0RCT_CUSTOM_VIEW_PROPERTY(inlineSize, id, ABI45_0_0RNSVGText)
{
    view.inlineSize = [ABI45_0_0RCTConvert ABI45_0_0RNSVGLength:json];
}
ABI45_0_0RCT_CUSTOM_VIEW_PROPERTY(textLength, id, ABI45_0_0RNSVGText)
{
    view.textLength = [ABI45_0_0RCTConvert ABI45_0_0RNSVGLength:json];
}
ABI45_0_0RCT_CUSTOM_VIEW_PROPERTY(baselineShift, id, ABI45_0_0RNSVGText)
{
    if ([json isKindOfClass:[NSString class]]) {
        NSString *stringValue = (NSString *)json;
        view.baselineShift = stringValue;
    } else {
        view.baselineShift = [NSString stringWithFormat:@"%f", [json doubleValue]];
    }
}
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(lengthAdjust, NSString)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(alignmentBaseline, NSString)

ABI45_0_0RCT_CUSTOM_VIEW_PROPERTY(fontSize, id, ABI45_0_0RNSVGText)
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

ABI45_0_0RCT_CUSTOM_VIEW_PROPERTY(fontWeight, id, ABI45_0_0RNSVGText)
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
