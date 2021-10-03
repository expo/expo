/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI43_0_0RNSVGClipPathManager.h"
#import "ABI43_0_0RNSVGClipPath.h"

@implementation ABI43_0_0RNSVGClipPathManager

ABI43_0_0RCT_EXPORT_MODULE()

- (ABI43_0_0RNSVGNode *)node
{
  return [ABI43_0_0RNSVGClipPath new];
}

@end
