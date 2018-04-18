/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI27_0_0ARTSurfaceViewManager.h"

#import "ABI27_0_0ARTSurfaceView.h"

@implementation ABI27_0_0ARTSurfaceViewManager

ABI27_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI27_0_0ARTSurfaceView new];
}

@end
