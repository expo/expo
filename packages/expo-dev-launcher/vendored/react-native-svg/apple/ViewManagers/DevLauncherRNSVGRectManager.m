/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "DevLauncherRNSVGRectManager.h"

#import "DevLauncherRNSVGRect.h"
#import "RCTConvert+DevLauncherRNSVG.h"

@implementation DevLauncherRNSVGRectManager

- (DevLauncherRNSVGRenderable *)node
{
  return [DevLauncherRNSVGRect new];
}

RCT_EXPORT_VIEW_PROPERTY(x, DevLauncherRNSVGLength*)
RCT_EXPORT_VIEW_PROPERTY(y, DevLauncherRNSVGLength*)
RCT_EXPORT_VIEW_PROPERTY(rectheight, DevLauncherRNSVGLength*)
RCT_EXPORT_VIEW_PROPERTY(rectwidth, DevLauncherRNSVGLength*)
RCT_CUSTOM_VIEW_PROPERTY(height, id, DevLauncherRNSVGRect)
{
    view.rectheight = [RCTConvert DevLauncherRNSVGLength:json];
}

RCT_CUSTOM_VIEW_PROPERTY(width, id, DevLauncherRNSVGRect)
{
    view.rectwidth = [RCTConvert DevLauncherRNSVGLength:json];
}
RCT_EXPORT_VIEW_PROPERTY(rx, DevLauncherRNSVGLength*)
RCT_EXPORT_VIEW_PROPERTY(ry, DevLauncherRNSVGLength*)

@end
