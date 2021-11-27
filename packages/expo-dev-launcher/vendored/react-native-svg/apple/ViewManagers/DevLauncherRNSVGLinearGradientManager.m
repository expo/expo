/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "DevLauncherRNSVGLinearGradientManager.h"
#import "DevLauncherRNSVGLinearGradient.h"

@implementation DevLauncherRNSVGLinearGradientManager

RCT_EXPORT_MODULE()

- (DevLauncherRNSVGNode *)node
{
  return [DevLauncherRNSVGLinearGradient new];
}

RCT_EXPORT_VIEW_PROPERTY(x1, DevLauncherRNSVGLength*)
RCT_EXPORT_VIEW_PROPERTY(y1, DevLauncherRNSVGLength*)
RCT_EXPORT_VIEW_PROPERTY(x2, DevLauncherRNSVGLength*)
RCT_EXPORT_VIEW_PROPERTY(y2, DevLauncherRNSVGLength*)
RCT_EXPORT_VIEW_PROPERTY(gradient, NSArray<NSNumber *>)
RCT_EXPORT_VIEW_PROPERTY(gradientUnits, DevLauncherRNSVGUnits)
RCT_EXPORT_VIEW_PROPERTY(gradientTransform, CGAffineTransform)

@end
