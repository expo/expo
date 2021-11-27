/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "DevLauncherRNSVGTextManager.h"

#import "DevLauncherRNSVGText.h"
#import "RCTConvert+DevLauncherRNSVG.h"

@implementation DevLauncherRNSVGTextManager

RCT_EXPORT_MODULE()

- (DevLauncherRNSVGRenderable *)node
{
  return [DevLauncherRNSVGText new];
}

RCT_EXPORT_VIEW_PROPERTY(textAnchor, DevLauncherRNSVGTextAnchor)
RCT_CUSTOM_VIEW_PROPERTY(dx, id, DevLauncherRNSVGText)
{
    view.deltaX = [RCTConvert DevLauncherRNSVGLengthArray:json];
}
RCT_CUSTOM_VIEW_PROPERTY(dy, id, DevLauncherRNSVGText)
{
    view.deltaY = [RCTConvert DevLauncherRNSVGLengthArray:json];
}
RCT_CUSTOM_VIEW_PROPERTY(positionX, id, DevLauncherRNSVGText)
{
    view.positionX = [RCTConvert DevLauncherRNSVGLengthArray:json];
}

RCT_CUSTOM_VIEW_PROPERTY(positionY, id, DevLauncherRNSVGText)
{
    view.positionY = [RCTConvert DevLauncherRNSVGLengthArray:json];
}
RCT_CUSTOM_VIEW_PROPERTY(x, id, DevLauncherRNSVGText)
{
    view.positionX = [RCTConvert DevLauncherRNSVGLengthArray:json];
}

RCT_CUSTOM_VIEW_PROPERTY(y, id, DevLauncherRNSVGText)
{
    view.positionY = [RCTConvert DevLauncherRNSVGLengthArray:json];
}
RCT_CUSTOM_VIEW_PROPERTY(rotate, id, DevLauncherRNSVGText)
{
    view.rotate = [RCTConvert DevLauncherRNSVGLengthArray:json];
}
RCT_EXPORT_VIEW_PROPERTY(font, NSDictionary)
RCT_CUSTOM_VIEW_PROPERTY(inlineSize, id, DevLauncherRNSVGText)
{
    view.inlineSize = [RCTConvert DevLauncherRNSVGLength:json];
}
RCT_CUSTOM_VIEW_PROPERTY(textLength, id, DevLauncherRNSVGText)
{
    view.textLength = [RCTConvert DevLauncherRNSVGLength:json];
}
RCT_CUSTOM_VIEW_PROPERTY(baselineShift, id, DevLauncherRNSVGText)
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

RCT_CUSTOM_VIEW_PROPERTY(fontSize, id, DevLauncherRNSVGText)
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

RCT_CUSTOM_VIEW_PROPERTY(fontWeight, id, DevLauncherRNSVGText)
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
