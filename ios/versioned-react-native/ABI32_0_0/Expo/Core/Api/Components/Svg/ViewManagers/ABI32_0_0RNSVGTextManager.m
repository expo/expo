/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI32_0_0RNSVGTextManager.h"

#import "ABI32_0_0RNSVGText.h"
#import "ABI32_0_0RCTConvert+RNSVG.h"

@implementation ABI32_0_0RNSVGTextManager

ABI32_0_0RCT_EXPORT_MODULE()

- (ABI32_0_0RNSVGRenderable *)node
{
  return [ABI32_0_0RNSVGText new];
}

ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(textAnchor, ABI32_0_0RNSVGTextAnchor)
ABI32_0_0RCT_CUSTOM_VIEW_PROPERTY(dx, id, ABI32_0_0RNSVGText)
{
    view.deltaX = [ABI32_0_0RCTConvert ABI32_0_0RNSVGLengthArray:json];
}
ABI32_0_0RCT_CUSTOM_VIEW_PROPERTY(dy, id, ABI32_0_0RNSVGText)
{
    view.deltaY = [ABI32_0_0RCTConvert ABI32_0_0RNSVGLengthArray:json];
}
ABI32_0_0RCT_CUSTOM_VIEW_PROPERTY(positionX, id, ABI32_0_0RNSVGText)
{
    view.positionX = [ABI32_0_0RCTConvert ABI32_0_0RNSVGLengthArray:json];
}

ABI32_0_0RCT_CUSTOM_VIEW_PROPERTY(positionY, id, ABI32_0_0RNSVGText)
{
    view.positionY = [ABI32_0_0RCTConvert ABI32_0_0RNSVGLengthArray:json];
}
ABI32_0_0RCT_CUSTOM_VIEW_PROPERTY(x, id, ABI32_0_0RNSVGText)
{
    view.positionX = [ABI32_0_0RCTConvert ABI32_0_0RNSVGLengthArray:json];
}

ABI32_0_0RCT_CUSTOM_VIEW_PROPERTY(y, id, ABI32_0_0RNSVGText)
{
    view.positionY = [ABI32_0_0RCTConvert ABI32_0_0RNSVGLengthArray:json];
}
ABI32_0_0RCT_CUSTOM_VIEW_PROPERTY(rotate, id, ABI32_0_0RNSVGText)
{
    view.rotate = [ABI32_0_0RCTConvert ABI32_0_0RNSVGLengthArray:json];
}
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(font, NSDictionary)
ABI32_0_0RCT_CUSTOM_VIEW_PROPERTY(textLength, id, ABI32_0_0RNSVGText)
{
    view.textLength = [ABI32_0_0RCTConvert ABI32_0_0RNSVGLength:json];
}
ABI32_0_0RCT_CUSTOM_VIEW_PROPERTY(baselineShift, id, ABI32_0_0RNSVGText)
{
    if ([json isKindOfClass:[NSString class]]) {
        NSString *stringValue = (NSString *)json;
        view.baselineShift = stringValue;
    } else {
        view.baselineShift = [NSString stringWithFormat:@"%f", [json doubleValue]];
    }
}
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(lengthAdjust, NSString)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(alignmentBaseline, NSString)

@end
