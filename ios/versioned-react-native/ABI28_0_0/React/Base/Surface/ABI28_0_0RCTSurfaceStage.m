/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI28_0_0RCTSurfaceStage.h"

BOOL ABI28_0_0RCTSurfaceStageIsRunning(ABI28_0_0RCTSurfaceStage stage) {
  return
    (stage & ABI28_0_0RCTSurfaceStageSurfaceDidInitialLayout) &&
    !(stage & ABI28_0_0RCTSurfaceStageSurfaceDidStop);
}

BOOL ABI28_0_0RCTSurfaceStageIsPreparing(ABI28_0_0RCTSurfaceStage stage) {
  return
    !(stage & ABI28_0_0RCTSurfaceStageSurfaceDidInitialLayout) &&
    !(stage & ABI28_0_0RCTSurfaceStageSurfaceDidStop);
}
