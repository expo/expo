/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI46_0_0RNSVGTextManager.h"

#import "ABI46_0_0RNSVGText.h"
#import "ABI46_0_0RCTConvert+RNSVG.h"

@implementation ABI46_0_0RNSVGTextManager

ABI46_0_0RCT_EXPORT_MODULE()

- (ABI46_0_0RNSVGRenderable *)node
{
  return [ABI46_0_0RNSVGText new];
}

ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(textAnchor, ABI46_0_0RNSVGTextAnchor)
ABI46_0_0RCT_CUSTOM_VIEW_PROPERTY(dx, id, ABI46_0_0RNSVGText)
{
    view.deltaX = [ABI46_0_0RCTConvert ABI46_0_0RNSVGLengthArray:json];
}
ABI46_0_0RCT_CUSTOM_VIEW_PROPERTY(dy, id, ABI46_0_0RNSVGText)
{
    view.deltaY = [ABI46_0_0RCTConvert ABI46_0_0RNSVGLengthArray:json];
}
ABI46_0_0RCT_CUSTOM_VIEW_PROPERTY(positionX, id, ABI46_0_0RNSVGText)
{
    view.positionX = [ABI46_0_0RCTConvert ABI46_0_0RNSVGLengthArray:json];
}

ABI46_0_0RCT_CUSTOM_VIEW_PROPERTY(positionY, id, ABI46_0_0RNSVGText)
{
    view.positionY = [ABI46_0_0RCTConvert ABI46_0_0RNSVGLengthArray:json];
}
ABI46_0_0RCT_CUSTOM_VIEW_PROPERTY(x, id, ABI46_0_0RNSVGText)
{
    view.positionX = [ABI46_0_0RCTConvert ABI46_0_0RNSVGLengthArray:json];
}

ABI46_0_0RCT_CUSTOM_VIEW_PROPERTY(y, id, ABI46_0_0RNSVGText)
{
    view.positionY = [ABI46_0_0RCTConvert ABI46_0_0RNSVGLengthArray:json];
}
ABI46_0_0RCT_CUSTOM_VIEW_PROPERTY(rotate, id, ABI46_0_0RNSVGText)
{
    view.rotate = [ABI46_0_0RCTConvert ABI46_0_0RNSVGLengthArray:json];
}
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(font, NSDictionary)
ABI46_0_0RCT_CUSTOM_VIEW_PROPERTY(inlineSize, id, ABI46_0_0RNSVGText)
{
    view.inlineSize = [ABI46_0_0RCTConvert ABI46_0_0RNSVGLength:json];
}
ABI46_0_0RCT_CUSTOM_VIEW_PROPERTY(textLength, id, ABI46_0_0RNSVGText)
{
    view.textLength = [ABI46_0_0RCTConvert ABI46_0_0RNSVGLength:json];
}
ABI46_0_0RCT_CUSTOM_VIEW_PROPERTY(baselineShift, id, ABI46_0_0RNSVGText)
{
    if ([json isKindOfClass:[NSString class]]) {
        NSString *stringValue = (NSString *)json;
        view.baselineShift = stringValue;
    } else {
        view.baselineShift = [NSString stringWithFormat:@"%f", [json doubleValue]];
    }
}
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(lengthAdjust, NSString)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(alignmentBaseline, NSString)

ABI46_0_0RCT_CUSTOM_VIEW_PROPERTY(fontSize, id, ABI46_0_0RNSVGText)
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

ABI46_0_0RCT_CUSTOM_VIEW_PROPERTY(fontWeight, id, ABI46_0_0RNSVGText)
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
