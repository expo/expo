/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI5_0_0RCTVirtualImageManager.h"
#import "ABI5_0_0RCTShadowVirtualImage.h"

@implementation ABI5_0_0RCTVirtualImageManager

ABI5_0_0RCT_EXPORT_MODULE()

- (ABI5_0_0RCTShadowView *)shadowView
{
  return [[ABI5_0_0RCTShadowVirtualImage alloc] initWithBridge:self.bridge];
}

ABI5_0_0RCT_EXPORT_SHADOW_PROPERTY(source, ABI5_0_0RCTImageSource)
ABI5_0_0RCT_EXPORT_SHADOW_PROPERTY(resizeMode, UIViewContentMode)

@end
