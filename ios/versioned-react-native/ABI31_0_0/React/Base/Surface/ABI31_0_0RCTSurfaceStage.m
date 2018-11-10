/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI31_0_0RCTSurfaceStage.h"

BOOL ABI31_0_0RCTSurfaceStageIsRunning(ABI31_0_0RCTSurfaceStage stage) {
  return
    (stage & ABI31_0_0RCTSurfaceStageSurfaceDidInitialLayout) &&
    !(stage & ABI31_0_0RCTSurfaceStageSurfaceDidStop);
}

BOOL ABI31_0_0RCTSurfaceStageIsPreparing(ABI31_0_0RCTSurfaceStage stage) {
  return
    !(stage & ABI31_0_0RCTSurfaceStageSurfaceDidInitialLayout) &&
    !(stage & ABI31_0_0RCTSurfaceStageSurfaceDidStop);
}
