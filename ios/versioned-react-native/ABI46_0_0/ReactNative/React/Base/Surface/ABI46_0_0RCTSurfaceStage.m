/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI46_0_0RCTSurfaceStage.h"

BOOL ABI46_0_0RCTSurfaceStageIsRunning(ABI46_0_0RCTSurfaceStage stage)
{
  return (stage & ABI46_0_0RCTSurfaceStageSurfaceDidInitialLayout) && !(stage & ABI46_0_0RCTSurfaceStageSurfaceDidStop);
}

BOOL ABI46_0_0RCTSurfaceStageIsPreparing(ABI46_0_0RCTSurfaceStage stage)
{
  return !(stage & ABI46_0_0RCTSurfaceStageSurfaceDidInitialLayout) && !(stage & ABI46_0_0RCTSurfaceStageSurfaceDidStop);
}
