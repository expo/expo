/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI38_0_0React/ABI38_0_0ARTSurfaceViewManager.h>

#import <ABI38_0_0React/ABI38_0_0ARTSurfaceView.h>

@implementation ABI38_0_0ARTSurfaceViewManager

ABI38_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI38_0_0ARTSurfaceView new];
}

@end
