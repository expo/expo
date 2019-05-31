/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI33_0_0RNSVGTextManager.h"

#import "ABI33_0_0RNSVGText.h"
#import "ABI33_0_0RCTConvert+RNSVG.h"

@implementation ABI33_0_0RNSVGTextManager

ABI33_0_0RCT_EXPORT_MODULE()

- (ABI33_0_0RNSVGRenderable *)node
{
  return [ABI33_0_0RNSVGText new];
}

ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(textAnchor, ABI33_0_0RNSVGTextAnchor)
ABI33_0_0RCT_CUSTOM_VIEW_PROPERTY(dx, id, ABI33_0_0RNSVGText)
{
    view.deltaX = [ABI33_0_0RCTConvert ABI33_0_0RNSVGLengthArray:json];
}
ABI33_0_0RCT_CUSTOM_VIEW_PROPERTY(dy, id, ABI33_0_0RNSVGText)
{
    view.deltaY = [ABI33_0_0RCTConvert ABI33_0_0RNSVGLengthArray:json];
}
ABI33_0_0RCT_CUSTOM_VIEW_PROPERTY(positionX, id, ABI33_0_0RNSVGText)
{
    view.positionX = [ABI33_0_0RCTConvert ABI33_0_0RNSVGLengthArray:json];
}

ABI33_0_0RCT_CUSTOM_VIEW_PROPERTY(positionY, id, ABI33_0_0RNSVGText)
{
    view.positionY = [ABI33_0_0RCTConvert ABI33_0_0RNSVGLengthArray:json];
}
ABI33_0_0RCT_CUSTOM_VIEW_PROPERTY(x, id, ABI33_0_0RNSVGText)
{
    view.positionX = [ABI33_0_0RCTConvert ABI33_0_0RNSVGLengthArray:json];
}

ABI33_0_0RCT_CUSTOM_VIEW_PROPERTY(y, id, ABI33_0_0RNSVGText)
{
    view.positionY = [ABI33_0_0RCTConvert ABI33_0_0RNSVGLengthArray:json];
}
ABI33_0_0RCT_CUSTOM_VIEW_PROPERTY(rotate, id, ABI33_0_0RNSVGText)
{
    view.rotate = [ABI33_0_0RCTConvert ABI33_0_0RNSVGLengthArray:json];
}
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(font, NSDictionary)
ABI33_0_0RCT_CUSTOM_VIEW_PROPERTY(textLength, id, ABI33_0_0RNSVGText)
{
    view.textLength = [ABI33_0_0RCTConvert ABI33_0_0RNSVGLength:json];
}
ABI33_0_0RCT_CUSTOM_VIEW_PROPERTY(baselineShift, id, ABI33_0_0RNSVGText)
{
    if ([json isKindOfClass:[NSString class]]) {
        NSString *stringValue = (NSString *)json;
        view.baselineShift = stringValue;
    } else {
        view.baselineShift = [NSString stringWithFormat:@"%f", [json doubleValue]];
    }
}
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(lengthAdjust, NSString)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(alignmentBaseline, NSString)

ABI33_0_0RCT_CUSTOM_VIEW_PROPERTY(fontSize, id, ABI33_0_0RNSVGGroup)
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

@end
