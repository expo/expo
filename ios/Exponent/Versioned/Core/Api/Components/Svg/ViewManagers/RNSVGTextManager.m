/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RNSVGTextManager.h"

#import "RNSVGText.h"
#import "RCTConvert+RNSVG.h"

@implementation RNSVGTextManager

RCT_EXPORT_MODULE()

- (RNSVGRenderable *)node
{
  return [RNSVGText new];
}

RCT_EXPORT_VIEW_PROPERTY(textAnchor, RNSVGTextAnchor)
RCT_CUSTOM_VIEW_PROPERTY(dx, id, RNSVGText)
{
    view.deltaX = [RCTConvert RNSVGLengthArray:json];
}
RCT_CUSTOM_VIEW_PROPERTY(dy, id, RNSVGText)
{
    view.deltaY = [RCTConvert RNSVGLengthArray:json];
}
RCT_CUSTOM_VIEW_PROPERTY(positionX, id, RNSVGText)
{
    view.positionX = [RCTConvert RNSVGLengthArray:json];
}

RCT_CUSTOM_VIEW_PROPERTY(positionY, id, RNSVGText)
{
    view.positionY = [RCTConvert RNSVGLengthArray:json];
}
RCT_CUSTOM_VIEW_PROPERTY(x, id, RNSVGText)
{
    view.positionX = [RCTConvert RNSVGLengthArray:json];
}

RCT_CUSTOM_VIEW_PROPERTY(y, id, RNSVGText)
{
    view.positionY = [RCTConvert RNSVGLengthArray:json];
}
RCT_CUSTOM_VIEW_PROPERTY(rotate, id, RNSVGText)
{
    view.rotate = [RCTConvert RNSVGLengthArray:json];
}
RCT_EXPORT_VIEW_PROPERTY(font, NSDictionary)
RCT_CUSTOM_VIEW_PROPERTY(textLength, id, RNSVGText)
{
    view.textLength = [RCTConvert RNSVGLength:json];
}
RCT_CUSTOM_VIEW_PROPERTY(baselineShift, id, RNSVGText)
{
    if ([json isKindOfClass:[NSString class]]) {
        NSString *stringValue = (NSString *)json;
        view.baselineShift = stringValue;
    } else {
        view.baselineShift = [NSString stringWithFormat:@"%f", [json doubleValue]];
    }
}
RCT_EXPORT_VIEW_PROPERTY(lengthAdjust, NSString)
RCT_EXPORT_VIEW_PROPERTY(alignmentBaseline, NSString)

@end
