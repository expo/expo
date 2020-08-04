/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI37_0_0React/ABI37_0_0RCTSurfaceStage.h>
#import <ABI37_0_0React/ABI37_0_0RCTSurfaceView.h>

@class ABI37_0_0RCTSurfaceRootView;

NS_ASSUME_NONNULL_BEGIN

@interface ABI37_0_0RCTSurfaceView (Internal)

@property (nonatomic, strong) ABI37_0_0RCTSurfaceRootView *rootView;
@property (nonatomic, assign) ABI37_0_0RCTSurfaceStage stage;

@end

NS_ASSUME_NONNULL_END
