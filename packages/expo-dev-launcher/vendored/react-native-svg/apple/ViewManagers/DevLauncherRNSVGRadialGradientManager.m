/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "DevLauncherRNSVGRadialGradientManager.h"
#import "DevLauncherRNSVGRadialGradient.h"

@implementation DevLauncherRNSVGRadialGradientManager

- (DevLauncherRNSVGNode *)node
{
  return [DevLauncherRNSVGRadialGradient new];
}

RCT_EXPORT_VIEW_PROPERTY(fx, DevLauncherRNSVGLength*)
RCT_EXPORT_VIEW_PROPERTY(fy, DevLauncherRNSVGLength*)
RCT_EXPORT_VIEW_PROPERTY(cx, DevLauncherRNSVGLength*)
RCT_EXPORT_VIEW_PROPERTY(cy, DevLauncherRNSVGLength*)
RCT_EXPORT_VIEW_PROPERTY(rx, DevLauncherRNSVGLength*)
RCT_EXPORT_VIEW_PROPERTY(ry, DevLauncherRNSVGLength*)
RCT_EXPORT_VIEW_PROPERTY(gradient, NSArray<NSNumber *>)
RCT_EXPORT_VIEW_PROPERTY(gradientUnits, DevLauncherRNSVGUnits)
RCT_EXPORT_VIEW_PROPERTY(gradientTransform, CGAffineTransform)

@end
