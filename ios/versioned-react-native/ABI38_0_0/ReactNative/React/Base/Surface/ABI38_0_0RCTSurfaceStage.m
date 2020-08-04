/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI38_0_0RCTSurfaceStage.h"

BOOL ABI38_0_0RCTSurfaceStageIsRunning(ABI38_0_0RCTSurfaceStage stage) {
  return
    (stage & ABI38_0_0RCTSurfaceStageSurfaceDidInitialLayout) &&
    !(stage & ABI38_0_0RCTSurfaceStageSurfaceDidStop);
}

BOOL ABI38_0_0RCTSurfaceStageIsPreparing(ABI38_0_0RCTSurfaceStage stage) {
  return
    !(stage & ABI38_0_0RCTSurfaceStageSurfaceDidInitialLayout) &&
    !(stage & ABI38_0_0RCTSurfaceStageSurfaceDidStop);
}
