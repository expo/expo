/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "DevLauncherRNSVGPatternManager.h"
#import "DevLauncherRNSVGPattern.h"

@implementation DevLauncherRNSVGPatternManager

- (DevLauncherRNSVGPattern *)node
{
    return [DevLauncherRNSVGPattern new];
}

RCT_EXPORT_VIEW_PROPERTY(x, DevLauncherRNSVGLength*)
RCT_EXPORT_VIEW_PROPERTY(y, DevLauncherRNSVGLength*)
RCT_EXPORT_VIEW_PROPERTY(patternheight, DevLauncherRNSVGLength*)
RCT_EXPORT_VIEW_PROPERTY(patternwidth, DevLauncherRNSVGLength*)
RCT_CUSTOM_VIEW_PROPERTY(height, id, DevLauncherRNSVGPattern)
{
    view.patternheight = [RCTConvert DevLauncherRNSVGLength:json];
}

RCT_CUSTOM_VIEW_PROPERTY(width, id, DevLauncherRNSVGPattern)
{
    view.patternwidth = [RCTConvert DevLauncherRNSVGLength:json];
}
RCT_EXPORT_VIEW_PROPERTY(patternUnits, DevLauncherRNSVGUnits)
RCT_EXPORT_VIEW_PROPERTY(patternContentUnits, DevLauncherRNSVGUnits)
RCT_EXPORT_VIEW_PROPERTY(patternTransform, CGAffineTransform)

RCT_EXPORT_VIEW_PROPERTY(minX, CGFloat)
RCT_EXPORT_VIEW_PROPERTY(minY, CGFloat)
RCT_EXPORT_VIEW_PROPERTY(vbWidth, CGFloat)
RCT_EXPORT_VIEW_PROPERTY(vbHeight, CGFloat)
RCT_EXPORT_VIEW_PROPERTY(align, NSString)
RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, DevLauncherRNSVGVBMOS)

@end
