/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI43_0_0RNSVGTextManager.h"

#import "ABI43_0_0RNSVGText.h"
#import "ABI43_0_0RCTConvert+RNSVG.h"

@implementation ABI43_0_0RNSVGTextManager

ABI43_0_0RCT_EXPORT_MODULE()

- (ABI43_0_0RNSVGRenderable *)node
{
  return [ABI43_0_0RNSVGText new];
}

ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(textAnchor, ABI43_0_0RNSVGTextAnchor)
ABI43_0_0RCT_CUSTOM_VIEW_PROPERTY(dx, id, ABI43_0_0RNSVGText)
{
    view.deltaX = [ABI43_0_0RCTConvert ABI43_0_0RNSVGLengthArray:json];
}
ABI43_0_0RCT_CUSTOM_VIEW_PROPERTY(dy, id, ABI43_0_0RNSVGText)
{
    view.deltaY = [ABI43_0_0RCTConvert ABI43_0_0RNSVGLengthArray:json];
}
ABI43_0_0RCT_CUSTOM_VIEW_PROPERTY(positionX, id, ABI43_0_0RNSVGText)
{
    view.positionX = [ABI43_0_0RCTConvert ABI43_0_0RNSVGLengthArray:json];
}

ABI43_0_0RCT_CUSTOM_VIEW_PROPERTY(positionY, id, ABI43_0_0RNSVGText)
{
    view.positionY = [ABI43_0_0RCTConvert ABI43_0_0RNSVGLengthArray:json];
}
ABI43_0_0RCT_CUSTOM_VIEW_PROPERTY(x, id, ABI43_0_0RNSVGText)
{
    view.positionX = [ABI43_0_0RCTConvert ABI43_0_0RNSVGLengthArray:json];
}

ABI43_0_0RCT_CUSTOM_VIEW_PROPERTY(y, id, ABI43_0_0RNSVGText)
{
    view.positionY = [ABI43_0_0RCTConvert ABI43_0_0RNSVGLengthArray:json];
}
ABI43_0_0RCT_CUSTOM_VIEW_PROPERTY(rotate, id, ABI43_0_0RNSVGText)
{
    view.rotate = [ABI43_0_0RCTConvert ABI43_0_0RNSVGLengthArray:json];
}
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(font, NSDictionary)
ABI43_0_0RCT_CUSTOM_VIEW_PROPERTY(inlineSize, id, ABI43_0_0RNSVGText)
{
    view.inlineSize = [ABI43_0_0RCTConvert ABI43_0_0RNSVGLength:json];
}
ABI43_0_0RCT_CUSTOM_VIEW_PROPERTY(textLength, id, ABI43_0_0RNSVGText)
{
    view.textLength = [ABI43_0_0RCTConvert ABI43_0_0RNSVGLength:json];
}
ABI43_0_0RCT_CUSTOM_VIEW_PROPERTY(baselineShift, id, ABI43_0_0RNSVGText)
{
    if ([json isKindOfClass:[NSString class]]) {
        NSString *stringValue = (NSString *)json;
        view.baselineShift = stringValue;
    } else {
        view.baselineShift = [NSString stringWithFormat:@"%f", [json doubleValue]];
    }
}
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(lengthAdjust, NSString)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(alignmentBaseline, NSString)

ABI43_0_0RCT_CUSTOM_VIEW_PROPERTY(fontSize, id, ABI43_0_0RNSVGText)
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

ABI43_0_0RCT_CUSTOM_VIEW_PROPERTY(fontWeight, id, ABI43_0_0RNSVGText)
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
