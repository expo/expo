/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RNSVGDefsManager.h"
#import "RNSVGDefs.h"

@implementation RNSVGDefsManager

RCT_EXPORT_MODULE()

- (RNSVGDefs *)node
{
  return [RNSVGDefs new];
}

- (RNSVGView *)view
{
  return [self node];
}

@end
