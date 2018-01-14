/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI25_0_0RCTSurfaceStage.h"

BOOL ABI25_0_0RCTSurfaceStageIsRunning(ABI25_0_0RCTSurfaceStage stage) {
  return
    (stage & ABI25_0_0RCTSurfaceStageSurfaceDidInitialLayout) &&
    !(stage & ABI25_0_0RCTSurfaceStageSurfaceDidStop);
}

BOOL ABI25_0_0RCTSurfaceStageIsPreparing(ABI25_0_0RCTSurfaceStage stage) {
  return
    !(stage & ABI25_0_0RCTSurfaceStageSurfaceDidInitialLayout) &&
    !(stage & ABI25_0_0RCTSurfaceStageSurfaceDidStop);
}
