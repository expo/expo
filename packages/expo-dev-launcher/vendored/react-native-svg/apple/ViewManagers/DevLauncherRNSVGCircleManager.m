/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "DevLauncherRNSVGCircleManager.h"

#import "DevLauncherRNSVGCircle.h"
#import "RCTConvert+DevLauncherRNSVG.h"

@implementation DevLauncherRNSVGCircleManager

- (DevLauncherRNSVGRenderable *)node
{
    return [DevLauncherRNSVGCircle new];
}

RCT_EXPORT_VIEW_PROPERTY(cx, DevLauncherRNSVGLength*)
RCT_EXPORT_VIEW_PROPERTY(cy, DevLauncherRNSVGLength*)
RCT_EXPORT_VIEW_PROPERTY(r, DevLauncherRNSVGLength*)

@end
