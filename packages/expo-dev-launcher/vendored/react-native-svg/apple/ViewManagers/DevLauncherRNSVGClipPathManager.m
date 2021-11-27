/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "DevLauncherRNSVGClipPathManager.h"
#import "DevLauncherRNSVGClipPath.h"

@implementation DevLauncherRNSVGClipPathManager

RCT_EXPORT_MODULE()

- (DevLauncherRNSVGNode *)node
{
  return [DevLauncherRNSVGClipPath new];
}

@end
