/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@class ABI47_0_0RCTSurfaceRootShadowView;

@protocol ABI47_0_0RCTSurfaceRootShadowViewDelegate <NSObject>

- (void)rootShadowView:(ABI47_0_0RCTSurfaceRootShadowView *)rootShadowView didChangeIntrinsicSize:(CGSize)instrinsicSize;
- (void)rootShadowViewDidStartRendering:(ABI47_0_0RCTSurfaceRootShadowView *)rootShadowView;
- (void)rootShadowViewDidStartLayingOut:(ABI47_0_0RCTSurfaceRootShadowView *)rootShadowView;

@end

NS_ASSUME_NONNULL_END
