/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI18_0_0ARTSurfaceViewManager.h"

#import "ABI18_0_0ARTSurfaceView.h"

@implementation ABI18_0_0ARTSurfaceViewManager

ABI18_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI18_0_0ARTSurfaceView new];
}

@end
