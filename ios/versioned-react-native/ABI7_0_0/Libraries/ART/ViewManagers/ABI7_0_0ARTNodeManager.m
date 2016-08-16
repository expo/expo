/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI7_0_0ARTNodeManager.h"

#import "ABI7_0_0ARTNode.h"

@implementation ABI7_0_0ARTNodeManager

ABI7_0_0RCT_EXPORT_MODULE()

- (ABI7_0_0ARTNode *)node
{
  return [ABI7_0_0ARTNode new];
}

- (UIView *)view
{
  return [self node];
}

- (ABI7_0_0RCTShadowView *)shadowView
{
  return nil;
}

ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, CGFloat)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(transform, CGAffineTransform)

@end
