/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

#import <ReactABI25_0_0/ABI25_0_0RCTSurfaceStage.h>

NS_ASSUME_NONNULL_BEGIN

@class ABI25_0_0RCTSurface;

@protocol ABI25_0_0RCTSurfaceDelegate <NSObject>

@optional

/**
 * Notifies a receiver that a surface transitioned to a new stage.
 * See `ABI25_0_0RCTSurfaceStage` for more details.
 */
- (void)surface:(ABI25_0_0RCTSurface *)surface didChangeStage:(ABI25_0_0RCTSurfaceStage)stage;

/**
 * Notifies a receiver that root view got a new (intrinsic) size during the last
 * layout pass.
 */
- (void)surface:(ABI25_0_0RCTSurface *)surface didChangeIntrinsicSize:(CGSize)intrinsicSize;

@end

NS_ASSUME_NONNULL_END
