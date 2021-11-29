/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "DevLauncherRNSVGDefsManager.h"
#import "DevLauncherRNSVGDefs.h"

@implementation DevLauncherRNSVGDefsManager

RCT_EXPORT_MODULE()

- (DevLauncherRNSVGDefs *)node
{
  return [DevLauncherRNSVGDefs new];
}

- (DevLauncherRNSVGView *)view
{
    return [self node];
}

@end
