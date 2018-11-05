/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI27_0_0RCTSurfaceStage.h"

BOOL ABI27_0_0RCTSurfaceStageIsRunning(ABI27_0_0RCTSurfaceStage stage) {
  return
    (stage & ABI27_0_0RCTSurfaceStageSurfaceDidInitialLayout) &&
    !(stage & ABI27_0_0RCTSurfaceStageSurfaceDidStop);
}

BOOL ABI27_0_0RCTSurfaceStageIsPreparing(ABI27_0_0RCTSurfaceStage stage) {
  return
    !(stage & ABI27_0_0RCTSurfaceStageSurfaceDidInitialLayout) &&
    !(stage & ABI27_0_0RCTSurfaceStageSurfaceDidStop);
}
