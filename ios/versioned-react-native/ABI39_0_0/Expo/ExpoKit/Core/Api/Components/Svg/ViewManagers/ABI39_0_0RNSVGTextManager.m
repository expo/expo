/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI39_0_0RNSVGTextManager.h"

#import "ABI39_0_0RNSVGText.h"
#import "ABI39_0_0RCTConvert+RNSVG.h"

@implementation ABI39_0_0RNSVGTextManager

ABI39_0_0RCT_EXPORT_MODULE()

- (ABI39_0_0RNSVGRenderable *)node
{
  return [ABI39_0_0RNSVGText new];
}

ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(textAnchor, ABI39_0_0RNSVGTextAnchor)
ABI39_0_0RCT_CUSTOM_VIEW_PROPERTY(dx, id, ABI39_0_0RNSVGText)
{
    view.deltaX = [ABI39_0_0RCTConvert ABI39_0_0RNSVGLengthArray:json];
}
ABI39_0_0RCT_CUSTOM_VIEW_PROPERTY(dy, id, ABI39_0_0RNSVGText)
{
    view.deltaY = [ABI39_0_0RCTConvert ABI39_0_0RNSVGLengthArray:json];
}
ABI39_0_0RCT_CUSTOM_VIEW_PROPERTY(positionX, id, ABI39_0_0RNSVGText)
{
    view.positionX = [ABI39_0_0RCTConvert ABI39_0_0RNSVGLengthArray:json];
}

ABI39_0_0RCT_CUSTOM_VIEW_PROPERTY(positionY, id, ABI39_0_0RNSVGText)
{
    view.positionY = [ABI39_0_0RCTConvert ABI39_0_0RNSVGLengthArray:json];
}
ABI39_0_0RCT_CUSTOM_VIEW_PROPERTY(x, id, ABI39_0_0RNSVGText)
{
    view.positionX = [ABI39_0_0RCTConvert ABI39_0_0RNSVGLengthArray:json];
}

ABI39_0_0RCT_CUSTOM_VIEW_PROPERTY(y, id, ABI39_0_0RNSVGText)
{
    view.positionY = [ABI39_0_0RCTConvert ABI39_0_0RNSVGLengthArray:json];
}
ABI39_0_0RCT_CUSTOM_VIEW_PROPERTY(rotate, id, ABI39_0_0RNSVGText)
{
    view.rotate = [ABI39_0_0RCTConvert ABI39_0_0RNSVGLengthArray:json];
}
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(font, NSDictionary)
ABI39_0_0RCT_CUSTOM_VIEW_PROPERTY(inlineSize, id, ABI39_0_0RNSVGText)
{
    view.inlineSize = [ABI39_0_0RCTConvert ABI39_0_0RNSVGLength:json];
}
ABI39_0_0RCT_CUSTOM_VIEW_PROPERTY(textLength, id, ABI39_0_0RNSVGText)
{
    view.textLength = [ABI39_0_0RCTConvert ABI39_0_0RNSVGLength:json];
}
ABI39_0_0RCT_CUSTOM_VIEW_PROPERTY(baselineShift, id, ABI39_0_0RNSVGText)
{
    if ([json isKindOfClass:[NSString class]]) {
        NSString *stringValue = (NSString *)json;
        view.baselineShift = stringValue;
    } else {
        view.baselineShift = [NSString stringWithFormat:@"%f", [json doubleValue]];
    }
}
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(lengthAdjust, NSString)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(alignmentBaseline, NSString)

ABI39_0_0RCT_CUSTOM_VIEW_PROPERTY(fontSize, id, ABI39_0_0RNSVGText)
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

ABI39_0_0RCT_CUSTOM_VIEW_PROPERTY(fontWeight, id, ABI39_0_0RNSVGText)
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
