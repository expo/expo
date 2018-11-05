/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ReactABI30_0_0/ABI30_0_0RCTSurfaceStage.h>

NS_ASSUME_NONNULL_BEGIN

@class ABI30_0_0RCTSurface;

@protocol ABI30_0_0RCTSurfaceDelegate <NSObject>

@optional

/**
 * Notifies a receiver that a surface transitioned to a new stage.
 * See `ABI30_0_0RCTSurfaceStage` for more details.
 */
- (void)surface:(ABI30_0_0RCTSurface *)surface didChangeStage:(ABI30_0_0RCTSurfaceStage)stage;

/**
 * Notifies a receiver that root view got a new (intrinsic) size during the last
 * layout pass.
 */
- (void)surface:(ABI30_0_0RCTSurface *)surface didChangeIntrinsicSize:(CGSize)intrinsicSize;

@end

NS_ASSUME_NONNULL_END
