/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI37_0_0React/ABI37_0_0ARTSurfaceViewManager.h>

#import <ABI37_0_0React/ABI37_0_0ARTSurfaceView.h>

@implementation ABI37_0_0ARTSurfaceViewManager

ABI37_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI37_0_0ARTSurfaceView new];
}

@end
