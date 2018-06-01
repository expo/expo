/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@class ABI28_0_0RCTSurface;

/**
 * UIView instance which represents the Surface
 */
@interface ABI28_0_0RCTSurfaceView : UIView

- (instancetype)initWithSurface:(ABI28_0_0RCTSurface *)surface NS_DESIGNATED_INITIALIZER;

@property (nonatomic, weak, readonly, nullable) ABI28_0_0RCTSurface *surface;

@end

NS_ASSUME_NONNULL_END
