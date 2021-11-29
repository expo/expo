/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "DevLauncherRNSVGPathManager.h"

#import "DevLauncherRNSVGPath.h"
#import "RCTConvert+DevLauncherRNSVG.h"

@implementation DevLauncherRNSVGPathManager

- (DevLauncherRNSVGRenderable *)node
{
  return [DevLauncherRNSVGPath new];
}

RCT_EXPORT_VIEW_PROPERTY(d, DevLauncherRNSVGCGPath)

@end
