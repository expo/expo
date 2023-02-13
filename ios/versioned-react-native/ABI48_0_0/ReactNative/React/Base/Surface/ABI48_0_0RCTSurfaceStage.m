/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI48_0_0RCTSurfaceStage.h"

BOOL ABI48_0_0RCTSurfaceStageIsRunning(ABI48_0_0RCTSurfaceStage stage)
{
  return (stage & ABI48_0_0RCTSurfaceStageSurfaceDidInitialLayout) && !(stage & ABI48_0_0RCTSurfaceStageSurfaceDidStop);
}

BOOL ABI48_0_0RCTSurfaceStageIsPreparing(ABI48_0_0RCTSurfaceStage stage)
{
  return !(stage & ABI48_0_0RCTSurfaceStageSurfaceDidInitialLayout) && !(stage & ABI48_0_0RCTSurfaceStageSurfaceDidStop);
}
