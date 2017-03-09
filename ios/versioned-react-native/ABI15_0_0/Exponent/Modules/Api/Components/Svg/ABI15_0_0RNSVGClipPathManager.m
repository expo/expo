/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI15_0_0RNSVGClipPathManager.h"
#import "ABI15_0_0RNSVGClipPath.h"

@implementation ABI15_0_0RNSVGClipPathManager

ABI15_0_0RCT_EXPORT_MODULE()

- (ABI15_0_0RNSVGNode *)node
{
  return [ABI15_0_0RNSVGClipPath new];
}

@end
