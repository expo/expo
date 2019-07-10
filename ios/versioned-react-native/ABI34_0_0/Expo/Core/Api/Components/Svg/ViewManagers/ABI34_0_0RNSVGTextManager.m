/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI34_0_0RNSVGTextManager.h"

#import "ABI34_0_0RNSVGText.h"
#import "ABI34_0_0RCTConvert+RNSVG.h"

@implementation ABI34_0_0RNSVGTextManager

ABI34_0_0RCT_EXPORT_MODULE()

- (ABI34_0_0RNSVGRenderable *)node
{
  return [ABI34_0_0RNSVGText new];
}

ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(textAnchor, ABI34_0_0RNSVGTextAnchor)
ABI34_0_0RCT_CUSTOM_VIEW_PROPERTY(dx, id, ABI34_0_0RNSVGText)
{
    view.deltaX = [ABI34_0_0RCTConvert ABI34_0_0RNSVGLengthArray:json];
}
ABI34_0_0RCT_CUSTOM_VIEW_PROPERTY(dy, id, ABI34_0_0RNSVGText)
{
    view.deltaY = [ABI34_0_0RCTConvert ABI34_0_0RNSVGLengthArray:json];
}
ABI34_0_0RCT_CUSTOM_VIEW_PROPERTY(positionX, id, ABI34_0_0RNSVGText)
{
    view.positionX = [ABI34_0_0RCTConvert ABI34_0_0RNSVGLengthArray:json];
}

ABI34_0_0RCT_CUSTOM_VIEW_PROPERTY(positionY, id, ABI34_0_0RNSVGText)
{
    view.positionY = [ABI34_0_0RCTConvert ABI34_0_0RNSVGLengthArray:json];
}
ABI34_0_0RCT_CUSTOM_VIEW_PROPERTY(x, id, ABI34_0_0RNSVGText)
{
    view.positionX = [ABI34_0_0RCTConvert ABI34_0_0RNSVGLengthArray:json];
}

ABI34_0_0RCT_CUSTOM_VIEW_PROPERTY(y, id, ABI34_0_0RNSVGText)
{
    view.positionY = [ABI34_0_0RCTConvert ABI34_0_0RNSVGLengthArray:json];
}
ABI34_0_0RCT_CUSTOM_VIEW_PROPERTY(rotate, id, ABI34_0_0RNSVGText)
{
    view.rotate = [ABI34_0_0RCTConvert ABI34_0_0RNSVGLengthArray:json];
}
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(font, NSDictionary)
ABI34_0_0RCT_CUSTOM_VIEW_PROPERTY(textLength, id, ABI34_0_0RNSVGText)
{
    view.textLength = [ABI34_0_0RCTConvert ABI34_0_0RNSVGLength:json];
}
ABI34_0_0RCT_CUSTOM_VIEW_PROPERTY(baselineShift, id, ABI34_0_0RNSVGText)
{
    if ([json isKindOfClass:[NSString class]]) {
        NSString *stringValue = (NSString *)json;
        view.baselineShift = stringValue;
    } else {
        view.baselineShift = [NSString stringWithFormat:@"%f", [json doubleValue]];
    }
}
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(lengthAdjust, NSString)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(alignmentBaseline, NSString)

ABI34_0_0RCT_CUSTOM_VIEW_PROPERTY(fontSize, id, ABI34_0_0RNSVGGroup)
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
