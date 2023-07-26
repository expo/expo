/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI49_0_0React/ABI49_0_0RCTDefines.h>

/**
 * The stage of the Surface
 */
typedef NS_OPTIONS(NSInteger, ABI49_0_0RCTSurfaceStage) {
  ABI49_0_0RCTSurfaceStageSurfaceDidInitialize = 1 << 0, // Surface object was created
  ABI49_0_0RCTSurfaceStageBridgeDidLoad = 1 << 1, // Bridge was loaded
  ABI49_0_0RCTSurfaceStageModuleDidLoad = 1 << 2, // Module (JavaScript code) was loaded
  ABI49_0_0RCTSurfaceStageSurfaceDidRun = 1 << 3, // Module (JavaScript code) was run
  ABI49_0_0RCTSurfaceStageSurfaceDidInitialRendering = 1 << 4, // UIManager created the first shadow views
  ABI49_0_0RCTSurfaceStageSurfaceDidInitialLayout = 1 << 5, // UIManager completed the first layout pass
  ABI49_0_0RCTSurfaceStageSurfaceDidInitialMounting = 1 << 6, // UIManager completed the first mounting pass
  ABI49_0_0RCTSurfaceStageSurfaceDidStop = 1 << 7, // Surface stopped

  // Most of the previously existed stages make no sense in the new architecture;
  // now Surface exposes only two simple stages:
  ABI49_0_0RCTSurfaceStagePreparing = ABI49_0_0RCTSurfaceStageSurfaceDidInitialize | ABI49_0_0RCTSurfaceStageBridgeDidLoad |
      ABI49_0_0RCTSurfaceStageModuleDidLoad,
  ABI49_0_0RCTSurfaceStageRunning = ABI49_0_0RCTSurfaceStagePreparing | ABI49_0_0RCTSurfaceStageSurfaceDidRun |
      ABI49_0_0RCTSurfaceStageSurfaceDidInitialRendering | ABI49_0_0RCTSurfaceStageSurfaceDidInitialLayout |
      ABI49_0_0RCTSurfaceStageSurfaceDidInitialMounting,
};

/**
 * Returns `YES` if the stage is suitable for displaying normal ABI49_0_0React Native app.
 */
ABI49_0_0RCT_EXTERN BOOL ABI49_0_0RCTSurfaceStageIsRunning(ABI49_0_0RCTSurfaceStage stage);

/**
 * Returns `YES` if the stage is suitable for displaying activity indicator.
 */
ABI49_0_0RCT_EXTERN BOOL ABI49_0_0RCTSurfaceStageIsPreparing(ABI49_0_0RCTSurfaceStage stage);
