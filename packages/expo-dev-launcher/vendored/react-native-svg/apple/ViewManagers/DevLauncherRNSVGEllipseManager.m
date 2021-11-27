/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "DevLauncherRNSVGEllipseManager.h"

#import "DevLauncherRNSVGEllipse.h"
#import "RCTConvert+DevLauncherRNSVG.h"

@implementation DevLauncherRNSVGEllipseManager

RCT_EXPORT_MODULE()

- (DevLauncherRNSVGRenderable *)node
{
  return [DevLauncherRNSVGEllipse new];
}

RCT_EXPORT_VIEW_PROPERTY(cx, DevLauncherRNSVGLength*)
RCT_EXPORT_VIEW_PROPERTY(cy, DevLauncherRNSVGLength*)
RCT_EXPORT_VIEW_PROPERTY(rx, DevLauncherRNSVGLength*)
RCT_EXPORT_VIEW_PROPERTY(ry, DevLauncherRNSVGLength*)

@end
