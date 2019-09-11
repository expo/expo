/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI35_0_0RNSVGTextManager.h"

#import "ABI35_0_0RNSVGText.h"
#import "ABI35_0_0RCTConvert+RNSVG.h"

@implementation ABI35_0_0RNSVGTextManager

ABI35_0_0RCT_EXPORT_MODULE()

- (ABI35_0_0RNSVGRenderable *)node
{
  return [ABI35_0_0RNSVGText new];
}

ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(textAnchor, ABI35_0_0RNSVGTextAnchor)
ABI35_0_0RCT_CUSTOM_VIEW_PROPERTY(dx, id, ABI35_0_0RNSVGText)
{
    view.deltaX = [ABI35_0_0RCTConvert ABI35_0_0RNSVGLengthArray:json];
}
ABI35_0_0RCT_CUSTOM_VIEW_PROPERTY(dy, id, ABI35_0_0RNSVGText)
{
    view.deltaY = [ABI35_0_0RCTConvert ABI35_0_0RNSVGLengthArray:json];
}
ABI35_0_0RCT_CUSTOM_VIEW_PROPERTY(positionX, id, ABI35_0_0RNSVGText)
{
    view.positionX = [ABI35_0_0RCTConvert ABI35_0_0RNSVGLengthArray:json];
}

ABI35_0_0RCT_CUSTOM_VIEW_PROPERTY(positionY, id, ABI35_0_0RNSVGText)
{
    view.positionY = [ABI35_0_0RCTConvert ABI35_0_0RNSVGLengthArray:json];
}
ABI35_0_0RCT_CUSTOM_VIEW_PROPERTY(x, id, ABI35_0_0RNSVGText)
{
    view.positionX = [ABI35_0_0RCTConvert ABI35_0_0RNSVGLengthArray:json];
}

ABI35_0_0RCT_CUSTOM_VIEW_PROPERTY(y, id, ABI35_0_0RNSVGText)
{
    view.positionY = [ABI35_0_0RCTConvert ABI35_0_0RNSVGLengthArray:json];
}
ABI35_0_0RCT_CUSTOM_VIEW_PROPERTY(rotate, id, ABI35_0_0RNSVGText)
{
    view.rotate = [ABI35_0_0RCTConvert ABI35_0_0RNSVGLengthArray:json];
}
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(font, NSDictionary)
ABI35_0_0RCT_CUSTOM_VIEW_PROPERTY(inlineSize, id, ABI35_0_0RNSVGText)
{
    view.inlineSize = [ABI35_0_0RCTConvert ABI35_0_0RNSVGLength:json];
}
ABI35_0_0RCT_CUSTOM_VIEW_PROPERTY(textLength, id, ABI35_0_0RNSVGText)
{
    view.textLength = [ABI35_0_0RCTConvert ABI35_0_0RNSVGLength:json];
}
ABI35_0_0RCT_CUSTOM_VIEW_PROPERTY(baselineShift, id, ABI35_0_0RNSVGText)
{
    if ([json isKindOfClass:[NSString class]]) {
        NSString *stringValue = (NSString *)json;
        view.baselineShift = stringValue;
    } else {
        view.baselineShift = [NSString stringWithFormat:@"%f", [json doubleValue]];
    }
}
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(lengthAdjust, NSString)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(alignmentBaseline, NSString)

ABI35_0_0RCT_CUSTOM_VIEW_PROPERTY(fontSize, id, ABI35_0_0RNSVGText)
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

ABI35_0_0RCT_CUSTOM_VIEW_PROPERTY(fontWeight, id, ABI35_0_0RNSVGText)
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
