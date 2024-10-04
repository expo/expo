/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI47_0_0RNSVGClipPathManager.h"
#import "ABI47_0_0RNSVGClipPath.h"

@implementation ABI47_0_0RNSVGClipPathManager

ABI47_0_0RCT_EXPORT_MODULE()

- (ABI47_0_0RNSVGNode *)node
{
  return [ABI47_0_0RNSVGClipPath new];
}

@end
