/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI43_0_0React/ABI43_0_0RCTShadowView.h>
#import <ABI43_0_0React/ABI43_0_0RCTSurfaceRootShadowViewDelegate.h>
#import <ABI43_0_0yoga/ABI43_0_0YGEnums.h>

@interface ABI43_0_0RCTSurfaceRootShadowView : ABI43_0_0RCTShadowView

@property (nonatomic, assign, readonly) CGSize minimumSize;
@property (nonatomic, assign, readonly) CGSize maximumSize;

- (void)setMinimumSize:(CGSize)size maximumSize:(CGSize)maximumSize;

@property (nonatomic, assign, readonly) CGSize intrinsicSize;

@property (nonatomic, weak) id<ABI43_0_0RCTSurfaceRootShadowViewDelegate> delegate;

/**
 * Layout direction (LTR or RTL) inherited from native environment and
 * is using as a base direction value in layout engine.
 * Defaults to value inferred from current locale.
 */
@property (nonatomic, assign) ABI43_0_0YGDirection baseDirection;

- (void)layoutWithAffectedShadowViews:(NSHashTable<ABI43_0_0RCTShadowView *> *)affectedShadowViews;

@end
