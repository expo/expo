/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI29_0_0RCTSurfaceStage.h"

BOOL ABI29_0_0RCTSurfaceStageIsRunning(ABI29_0_0RCTSurfaceStage stage) {
  return
    (stage & ABI29_0_0RCTSurfaceStageSurfaceDidInitialLayout) &&
    !(stage & ABI29_0_0RCTSurfaceStageSurfaceDidStop);
}

BOOL ABI29_0_0RCTSurfaceStageIsPreparing(ABI29_0_0RCTSurfaceStage stage) {
  return
    !(stage & ABI29_0_0RCTSurfaceStageSurfaceDidInitialLayout) &&
    !(stage & ABI29_0_0RCTSurfaceStageSurfaceDidStop);
}
