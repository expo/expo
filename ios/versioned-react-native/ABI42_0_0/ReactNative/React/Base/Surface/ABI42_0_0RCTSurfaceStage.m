/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI42_0_0RCTSurfaceStage.h"

BOOL ABI42_0_0RCTSurfaceStageIsRunning(ABI42_0_0RCTSurfaceStage stage)
{
  return (stage & ABI42_0_0RCTSurfaceStageSurfaceDidInitialLayout) && !(stage & ABI42_0_0RCTSurfaceStageSurfaceDidStop);
}

BOOL ABI42_0_0RCTSurfaceStageIsPreparing(ABI42_0_0RCTSurfaceStage stage)
{
  return !(stage & ABI42_0_0RCTSurfaceStageSurfaceDidInitialLayout) && !(stage & ABI42_0_0RCTSurfaceStageSurfaceDidStop);
}
