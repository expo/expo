/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

#import <ReactABI26_0_0/ABI26_0_0RCTDefines.h>

/**
 * The stage of the Surface
 */
typedef NS_OPTIONS(NSInteger, ABI26_0_0RCTSurfaceStage) {
  ABI26_0_0RCTSurfaceStageSurfaceDidInitialize = 1 << 0,        // Surface object was created
  ABI26_0_0RCTSurfaceStageBridgeDidLoad = 1 << 1,               // Bridge was loaded
  ABI26_0_0RCTSurfaceStageModuleDidLoad = 1 << 2,               // Module (JavaScript code) was loaded
  ABI26_0_0RCTSurfaceStageSurfaceDidRun = 1 << 3,               // Module (JavaScript code) was run
  ABI26_0_0RCTSurfaceStageSurfaceDidInitialRendering = 1 << 4,  // UIManager created the first shadow views
  ABI26_0_0RCTSurfaceStageSurfaceDidInitialLayout = 1 << 5,     // UIManager completed the first layout pass
  ABI26_0_0RCTSurfaceStageSurfaceDidInitialMounting = 1 << 6,   // UIManager completed the first mounting pass
  ABI26_0_0RCTSurfaceStageSurfaceDidStop = 1 << 7,              // Surface stopped
};

/**
 * Returns `YES` if the stage is suitable for displaying normal ReactABI26_0_0 Native app.
 */
ABI26_0_0RCT_EXTERN BOOL ABI26_0_0RCTSurfaceStageIsRunning(ABI26_0_0RCTSurfaceStage stage);

/**
 * Returns `YES` if the stage is suitable for displaying activity indicator.
 */
ABI26_0_0RCT_EXTERN BOOL ABI26_0_0RCTSurfaceStageIsPreparing(ABI26_0_0RCTSurfaceStage stage);
