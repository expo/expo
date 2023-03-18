/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI48_0_0React/ABI48_0_0RCTDefines.h>

/**
 * The stage of the Surface
 */
typedef NS_OPTIONS(NSInteger, ABI48_0_0RCTSurfaceStage) {
  ABI48_0_0RCTSurfaceStageSurfaceDidInitialize = 1 << 0, // Surface object was created
  ABI48_0_0RCTSurfaceStageBridgeDidLoad = 1 << 1, // Bridge was loaded
  ABI48_0_0RCTSurfaceStageModuleDidLoad = 1 << 2, // Module (JavaScript code) was loaded
  ABI48_0_0RCTSurfaceStageSurfaceDidRun = 1 << 3, // Module (JavaScript code) was run
  ABI48_0_0RCTSurfaceStageSurfaceDidInitialRendering = 1 << 4, // UIManager created the first shadow views
  ABI48_0_0RCTSurfaceStageSurfaceDidInitialLayout = 1 << 5, // UIManager completed the first layout pass
  ABI48_0_0RCTSurfaceStageSurfaceDidInitialMounting = 1 << 6, // UIManager completed the first mounting pass
  ABI48_0_0RCTSurfaceStageSurfaceDidStop = 1 << 7, // Surface stopped

  // Most of the previously existed stages make no sense in the new architecture;
  // now Surface exposes only two simple stages:
  ABI48_0_0RCTSurfaceStagePreparing = ABI48_0_0RCTSurfaceStageSurfaceDidInitialize | ABI48_0_0RCTSurfaceStageBridgeDidLoad |
      ABI48_0_0RCTSurfaceStageModuleDidLoad,
  ABI48_0_0RCTSurfaceStageRunning = ABI48_0_0RCTSurfaceStagePreparing | ABI48_0_0RCTSurfaceStageSurfaceDidRun |
      ABI48_0_0RCTSurfaceStageSurfaceDidInitialRendering | ABI48_0_0RCTSurfaceStageSurfaceDidInitialLayout |
      ABI48_0_0RCTSurfaceStageSurfaceDidInitialMounting,
};

/**
 * Returns `YES` if the stage is suitable for displaying normal ABI48_0_0React Native app.
 */
ABI48_0_0RCT_EXTERN BOOL ABI48_0_0RCTSurfaceStageIsRunning(ABI48_0_0RCTSurfaceStage stage);

/**
 * Returns `YES` if the stage is suitable for displaying activity indicator.
 */
ABI48_0_0RCT_EXTERN BOOL ABI48_0_0RCTSurfaceStageIsPreparing(ABI48_0_0RCTSurfaceStage stage);
