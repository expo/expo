/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI49_0_0React/ABI49_0_0RCTSurfaceStage.h>
#import <ABI49_0_0React/ABI49_0_0RCTSurfaceView.h>

@class ABI49_0_0RCTSurfaceRootView;

NS_ASSUME_NONNULL_BEGIN

@interface ABI49_0_0RCTSurfaceView (Internal)

@property (nonatomic, nullable, strong) ABI49_0_0RCTSurfaceRootView *rootView;
@property (nonatomic, assign) ABI49_0_0RCTSurfaceStage stage;

@end

NS_ASSUME_NONNULL_END
