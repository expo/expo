/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI19_0_0ARTSurfaceViewManager.h"

#import "ABI19_0_0ARTSurfaceView.h"

@implementation ABI19_0_0ARTSurfaceViewManager

ABI19_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI19_0_0ARTSurfaceView new];
}

@end
