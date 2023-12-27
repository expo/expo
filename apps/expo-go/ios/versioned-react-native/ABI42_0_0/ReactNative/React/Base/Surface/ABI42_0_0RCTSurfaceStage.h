/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI42_0_0React/ABI42_0_0RCTDefines.h>

/**
 * The stage of the Surface
 */
typedef NS_OPTIONS(NSInteger, ABI42_0_0RCTSurfaceStage) {
  ABI42_0_0RCTSurfaceStageSurfaceDidInitialize = 1 << 0, // Surface object was created
  ABI42_0_0RCTSurfaceStageBridgeDidLoad = 1 << 1, // Bridge was loaded
  ABI42_0_0RCTSurfaceStageModuleDidLoad = 1 << 2, // Module (JavaScript code) was loaded
  ABI42_0_0RCTSurfaceStageSurfaceDidRun = 1 << 3, // Module (JavaScript code) was run
  ABI42_0_0RCTSurfaceStageSurfaceDidInitialRendering = 1 << 4, // UIManager created the first shadow views
  ABI42_0_0RCTSurfaceStageSurfaceDidInitialLayout = 1 << 5, // UIManager completed the first layout pass
  ABI42_0_0RCTSurfaceStageSurfaceDidInitialMounting = 1 << 6, // UIManager completed the first mounting pass
  ABI42_0_0RCTSurfaceStageSurfaceDidStop = 1 << 7, // Surface stopped

  // Most of the previously existed stages make no sense in the new architecture;
  // now Surface exposes only three simple stages:
  //
  // Surface object was constructed and still valid.
  ABI42_0_0RCTSurfaceStageInitialized = ABI42_0_0RCTSurfaceStageSurfaceDidInitialize,
  // Surface was started.
  ABI42_0_0RCTSurfaceStageStarted = 1 << 8,
  // All off-main-thread work is done; we are ready to mount the UI.
  ABI42_0_0RCTSurfaceStagePrepared = ABI42_0_0RCTSurfaceStageBridgeDidLoad | ABI42_0_0RCTSurfaceStageModuleDidLoad | ABI42_0_0RCTSurfaceStageSurfaceDidRun |
      ABI42_0_0RCTSurfaceStageSurfaceDidInitialRendering | ABI42_0_0RCTSurfaceStageSurfaceDidInitialLayout,
  // All main-thread work is done, the UI was mounted.
  ABI42_0_0RCTSurfaceStageMounted = ABI42_0_0RCTSurfaceStageSurfaceDidInitialMounting,
};

/**
 * Returns `YES` if the stage is suitable for displaying normal ABI42_0_0React Native app.
 */
ABI42_0_0RCT_EXTERN BOOL ABI42_0_0RCTSurfaceStageIsRunning(ABI42_0_0RCTSurfaceStage stage);

/**
 * Returns `YES` if the stage is suitable for displaying activity indicator.
 */
ABI42_0_0RCT_EXTERN BOOL ABI42_0_0RCTSurfaceStageIsPreparing(ABI42_0_0RCTSurfaceStage stage);
