/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI41_0_0RNSVGTextManager.h"

#import "ABI41_0_0RNSVGText.h"
#import "ABI41_0_0RCTConvert+RNSVG.h"

@implementation ABI41_0_0RNSVGTextManager

ABI41_0_0RCT_EXPORT_MODULE()

- (ABI41_0_0RNSVGRenderable *)node
{
  return [ABI41_0_0RNSVGText new];
}

ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(textAnchor, ABI41_0_0RNSVGTextAnchor)
ABI41_0_0RCT_CUSTOM_VIEW_PROPERTY(dx, id, ABI41_0_0RNSVGText)
{
    view.deltaX = [ABI41_0_0RCTConvert ABI41_0_0RNSVGLengthArray:json];
}
ABI41_0_0RCT_CUSTOM_VIEW_PROPERTY(dy, id, ABI41_0_0RNSVGText)
{
    view.deltaY = [ABI41_0_0RCTConvert ABI41_0_0RNSVGLengthArray:json];
}
ABI41_0_0RCT_CUSTOM_VIEW_PROPERTY(positionX, id, ABI41_0_0RNSVGText)
{
    view.positionX = [ABI41_0_0RCTConvert ABI41_0_0RNSVGLengthArray:json];
}

ABI41_0_0RCT_CUSTOM_VIEW_PROPERTY(positionY, id, ABI41_0_0RNSVGText)
{
    view.positionY = [ABI41_0_0RCTConvert ABI41_0_0RNSVGLengthArray:json];
}
ABI41_0_0RCT_CUSTOM_VIEW_PROPERTY(x, id, ABI41_0_0RNSVGText)
{
    view.positionX = [ABI41_0_0RCTConvert ABI41_0_0RNSVGLengthArray:json];
}

ABI41_0_0RCT_CUSTOM_VIEW_PROPERTY(y, id, ABI41_0_0RNSVGText)
{
    view.positionY = [ABI41_0_0RCTConvert ABI41_0_0RNSVGLengthArray:json];
}
ABI41_0_0RCT_CUSTOM_VIEW_PROPERTY(rotate, id, ABI41_0_0RNSVGText)
{
    view.rotate = [ABI41_0_0RCTConvert ABI41_0_0RNSVGLengthArray:json];
}
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(font, NSDictionary)
ABI41_0_0RCT_CUSTOM_VIEW_PROPERTY(inlineSize, id, ABI41_0_0RNSVGText)
{
    view.inlineSize = [ABI41_0_0RCTConvert ABI41_0_0RNSVGLength:json];
}
ABI41_0_0RCT_CUSTOM_VIEW_PROPERTY(textLength, id, ABI41_0_0RNSVGText)
{
    view.textLength = [ABI41_0_0RCTConvert ABI41_0_0RNSVGLength:json];
}
ABI41_0_0RCT_CUSTOM_VIEW_PROPERTY(baselineShift, id, ABI41_0_0RNSVGText)
{
    if ([json isKindOfClass:[NSString class]]) {
        NSString *stringValue = (NSString *)json;
        view.baselineShift = stringValue;
    } else {
        view.baselineShift = [NSString stringWithFormat:@"%f", [json doubleValue]];
    }
}
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(lengthAdjust, NSString)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(alignmentBaseline, NSString)

ABI41_0_0RCT_CUSTOM_VIEW_PROPERTY(fontSize, id, ABI41_0_0RNSVGText)
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

ABI41_0_0RCT_CUSTOM_VIEW_PROPERTY(fontWeight, id, ABI41_0_0RNSVGText)
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
