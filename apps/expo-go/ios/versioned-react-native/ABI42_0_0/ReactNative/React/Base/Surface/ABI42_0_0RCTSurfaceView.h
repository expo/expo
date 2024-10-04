/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@class ABI42_0_0RCTSurface;

/**
 * UIView instance which represents the Surface
 */
@interface ABI42_0_0RCTSurfaceView : UIView

- (instancetype)initWithSurface:(ABI42_0_0RCTSurface *)surface NS_DESIGNATED_INITIALIZER;

@property (nonatomic, weak, readonly, nullable) ABI42_0_0RCTSurface *surface;

@end

NS_ASSUME_NONNULL_END
