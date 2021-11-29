/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "DevLauncherRNSVGMaskManager.h"
#import "DevLauncherRNSVGMask.h"

@implementation DevLauncherRNSVGMaskManager

RCT_EXPORT_MODULE()

- (DevLauncherRNSVGMask *)node
{
    return [DevLauncherRNSVGMask new];
}

RCT_EXPORT_VIEW_PROPERTY(x, DevLauncherRNSVGLength*)
RCT_EXPORT_VIEW_PROPERTY(y, DevLauncherRNSVGLength*)
RCT_EXPORT_VIEW_PROPERTY(maskheight, DevLauncherRNSVGLength*)
RCT_EXPORT_VIEW_PROPERTY(maskwidth, DevLauncherRNSVGLength*)
RCT_CUSTOM_VIEW_PROPERTY(height, id, DevLauncherRNSVGMask)
{
    view.maskheight = [RCTConvert DevLauncherRNSVGLength:json];
}
RCT_CUSTOM_VIEW_PROPERTY(width, id, DevLauncherRNSVGMask)
{
    view.maskwidth = [RCTConvert DevLauncherRNSVGLength:json];
}
RCT_EXPORT_VIEW_PROPERTY(maskUnits, DevLauncherRNSVGUnits)
RCT_EXPORT_VIEW_PROPERTY(maskContentUnits, DevLauncherRNSVGUnits)
RCT_EXPORT_VIEW_PROPERTY(maskTransform, CGAffineTransform)

@end
