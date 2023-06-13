/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RNSVGTextManager.h"

#import "RCTConvert+RNSVG.h"
#import "RNSVGText.h"

@implementation RNSVGTextManager

RCT_EXPORT_MODULE()

- (RNSVGRenderable *)node
{
  return [RNSVGText new];
}

RCT_CUSTOM_VIEW_PROPERTY(dx, id, RNSVGText)
{
  view.deltaX = [RCTConvert RNSVGLengthArray:json];
}
RCT_CUSTOM_VIEW_PROPERTY(dy, id, RNSVGText)
{
  view.deltaY = [RCTConvert RNSVGLengthArray:json];
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
RCT_CUSTOM_VIEW_PROPERTY(inlineSize, id, RNSVGText)
{
  view.inlineSize = [RCTConvert RNSVGLength:json];
}
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
RCT_EXPORT_VIEW_PROPERTY(verticalAlign, NSString) // unused on iOS

RCT_CUSTOM_VIEW_PROPERTY(fontSize, id, RNSVGText)
{
  if ([json isKindOfClass:[NSString class]]) {
    NSString *stringValue = (NSString *)json;
    view.font = @{@"fontSize" : stringValue};
  } else {
    NSNumber *number = (NSNumber *)json;
    double num = [number doubleValue];
    view.font = @{@"fontSize" : [NSNumber numberWithDouble:num]};
  }
}

RCT_CUSTOM_VIEW_PROPERTY(fontWeight, id, RNSVGText)
{
  if ([json isKindOfClass:[NSString class]]) {
    NSString *stringValue = (NSString *)json;
    view.font = @{@"fontWeight" : stringValue};
  } else {
    NSNumber *number = (NSNumber *)json;
    double num = [number doubleValue];
    view.font = @{@"fontWeight" : [NSNumber numberWithDouble:num]};
  }
}

@end
