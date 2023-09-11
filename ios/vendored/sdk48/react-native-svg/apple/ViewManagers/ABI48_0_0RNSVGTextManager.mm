/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI48_0_0RNSVGTextManager.h"

#import "ABI48_0_0RCTConvert+RNSVG.h"
#import "ABI48_0_0RNSVGText.h"

@implementation ABI48_0_0RNSVGTextManager

ABI48_0_0RCT_EXPORT_MODULE()

- (ABI48_0_0RNSVGRenderable *)node
{
  return [ABI48_0_0RNSVGText new];
}

ABI48_0_0RCT_CUSTOM_VIEW_PROPERTY(dx, id, ABI48_0_0RNSVGText)
{
  view.deltaX = [ABI48_0_0RCTConvert ABI48_0_0RNSVGLengthArray:json];
}
ABI48_0_0RCT_CUSTOM_VIEW_PROPERTY(dy, id, ABI48_0_0RNSVGText)
{
  view.deltaY = [ABI48_0_0RCTConvert ABI48_0_0RNSVGLengthArray:json];
}
ABI48_0_0RCT_CUSTOM_VIEW_PROPERTY(x, id, ABI48_0_0RNSVGText)
{
  view.positionX = [ABI48_0_0RCTConvert ABI48_0_0RNSVGLengthArray:json];
}

ABI48_0_0RCT_CUSTOM_VIEW_PROPERTY(y, id, ABI48_0_0RNSVGText)
{
  view.positionY = [ABI48_0_0RCTConvert ABI48_0_0RNSVGLengthArray:json];
}
ABI48_0_0RCT_CUSTOM_VIEW_PROPERTY(rotate, id, ABI48_0_0RNSVGText)
{
  view.rotate = [ABI48_0_0RCTConvert ABI48_0_0RNSVGLengthArray:json];
}
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(font, NSDictionary)
ABI48_0_0RCT_CUSTOM_VIEW_PROPERTY(inlineSize, id, ABI48_0_0RNSVGText)
{
  view.inlineSize = [ABI48_0_0RCTConvert ABI48_0_0RNSVGLength:json];
}
ABI48_0_0RCT_CUSTOM_VIEW_PROPERTY(textLength, id, ABI48_0_0RNSVGText)
{
  view.textLength = [ABI48_0_0RCTConvert ABI48_0_0RNSVGLength:json];
}
ABI48_0_0RCT_CUSTOM_VIEW_PROPERTY(baselineShift, id, ABI48_0_0RNSVGText)
{
  if ([json isKindOfClass:[NSString class]]) {
    NSString *stringValue = (NSString *)json;
    view.baselineShift = stringValue;
  } else {
    view.baselineShift = [NSString stringWithFormat:@"%f", [json doubleValue]];
  }
}
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(lengthAdjust, NSString)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(alignmentBaseline, NSString)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(verticalAlign, NSString) // unused on iOS

ABI48_0_0RCT_CUSTOM_VIEW_PROPERTY(fontSize, id, ABI48_0_0RNSVGText)
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

ABI48_0_0RCT_CUSTOM_VIEW_PROPERTY(fontWeight, id, ABI48_0_0RNSVGText)
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
