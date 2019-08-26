/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI31_0_0RNSVGTextManager.h"

#import "ABI31_0_0RNSVGText.h"
#import "ABI31_0_0RCTConvert+RNSVG.h"

@implementation ABI31_0_0RNSVGTextManager

ABI31_0_0RCT_EXPORT_MODULE()

- (ABI31_0_0RNSVGRenderable *)node
{
  return [ABI31_0_0RNSVGText new];
}

ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(textAnchor, ABI31_0_0RNSVGTextAnchor)
ABI31_0_0RCT_CUSTOM_VIEW_PROPERTY(dx, id, ABI31_0_0RNSVGText)
{
    view.deltaX = [ABI31_0_0RCTConvert ABI31_0_0RNSVGLengthArray:json];
}
ABI31_0_0RCT_CUSTOM_VIEW_PROPERTY(dy, id, ABI31_0_0RNSVGText)
{
    view.deltaY = [ABI31_0_0RCTConvert ABI31_0_0RNSVGLengthArray:json];
}
ABI31_0_0RCT_CUSTOM_VIEW_PROPERTY(positionX, id, ABI31_0_0RNSVGText)
{
    view.positionX = [ABI31_0_0RCTConvert ABI31_0_0RNSVGLengthArray:json];
}

ABI31_0_0RCT_CUSTOM_VIEW_PROPERTY(positionY, id, ABI31_0_0RNSVGText)
{
    view.positionY = [ABI31_0_0RCTConvert ABI31_0_0RNSVGLengthArray:json];
}
ABI31_0_0RCT_CUSTOM_VIEW_PROPERTY(x, id, ABI31_0_0RNSVGText)
{
    view.positionX = [ABI31_0_0RCTConvert ABI31_0_0RNSVGLengthArray:json];
}

ABI31_0_0RCT_CUSTOM_VIEW_PROPERTY(y, id, ABI31_0_0RNSVGText)
{
    view.positionY = [ABI31_0_0RCTConvert ABI31_0_0RNSVGLengthArray:json];
}
ABI31_0_0RCT_CUSTOM_VIEW_PROPERTY(rotate, id, ABI31_0_0RNSVGText)
{
    view.rotate = [ABI31_0_0RCTConvert ABI31_0_0RNSVGLengthArray:json];
}
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(font, NSDictionary)
ABI31_0_0RCT_CUSTOM_VIEW_PROPERTY(textLength, id, ABI31_0_0RNSVGText)
{
    view.textLength = [ABI31_0_0RCTConvert ABI31_0_0RNSVGLength:json];
}
ABI31_0_0RCT_CUSTOM_VIEW_PROPERTY(baselineShift, id, ABI31_0_0RNSVGText)
{
    if ([json isKindOfClass:[NSString class]]) {
        NSString *stringValue = (NSString *)json;
        view.baselineShift = stringValue;
    } else {
        view.baselineShift = [NSString stringWithFormat:@"%f", [json doubleValue]];
    }
}
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(lengthAdjust, NSString)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(alignmentBaseline, NSString)

@end
