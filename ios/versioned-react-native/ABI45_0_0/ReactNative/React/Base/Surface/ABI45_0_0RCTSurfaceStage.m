/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI45_0_0RCTSurfaceStage.h"

BOOL ABI45_0_0RCTSurfaceStageIsRunning(ABI45_0_0RCTSurfaceStage stage)
{
  return (stage & ABI45_0_0RCTSurfaceStageSurfaceDidInitialLayout) && !(stage & ABI45_0_0RCTSurfaceStageSurfaceDidStop);
}

BOOL ABI45_0_0RCTSurfaceStageIsPreparing(ABI45_0_0RCTSurfaceStage stage)
{
  return !(stage & ABI45_0_0RCTSurfaceStageSurfaceDidInitialLayout) && !(stage & ABI45_0_0RCTSurfaceStageSurfaceDidStop);
}
