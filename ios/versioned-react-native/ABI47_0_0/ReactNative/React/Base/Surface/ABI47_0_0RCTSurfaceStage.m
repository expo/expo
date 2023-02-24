/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI47_0_0RCTSurfaceStage.h"

BOOL ABI47_0_0RCTSurfaceStageIsRunning(ABI47_0_0RCTSurfaceStage stage)
{
  return (stage & ABI47_0_0RCTSurfaceStageSurfaceDidInitialLayout) && !(stage & ABI47_0_0RCTSurfaceStageSurfaceDidStop);
}

BOOL ABI47_0_0RCTSurfaceStageIsPreparing(ABI47_0_0RCTSurfaceStage stage)
{
  return !(stage & ABI47_0_0RCTSurfaceStageSurfaceDidInitialLayout) && !(stage & ABI47_0_0RCTSurfaceStageSurfaceDidStop);
}
