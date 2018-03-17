/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI26_0_0RCTSurfaceStage.h"

BOOL ABI26_0_0RCTSurfaceStageIsRunning(ABI26_0_0RCTSurfaceStage stage) {
  return
    (stage & ABI26_0_0RCTSurfaceStageSurfaceDidInitialLayout) &&
    !(stage & ABI26_0_0RCTSurfaceStageSurfaceDidStop);
}

BOOL ABI26_0_0RCTSurfaceStageIsPreparing(ABI26_0_0RCTSurfaceStage stage) {
  return
    !(stage & ABI26_0_0RCTSurfaceStageSurfaceDidInitialLayout) &&
    !(stage & ABI26_0_0RCTSurfaceStageSurfaceDidStop);
}
