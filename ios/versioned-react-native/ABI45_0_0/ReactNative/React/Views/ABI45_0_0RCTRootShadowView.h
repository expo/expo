/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI45_0_0React/ABI45_0_0RCTShadowView.h>
#import <ABI45_0_0yoga/ABI45_0_0YGEnums.h>

@interface ABI45_0_0RCTRootShadowView : ABI45_0_0RCTShadowView

/**
 * Minimum size to layout all views.
 * Defaults to CGSizeZero
 */
@property (nonatomic, assign) CGSize minimumSize;

/**
 * Available size to layout all views.
 * Defaults to {INFINITY, INFINITY}
 */
@property (nonatomic, assign) CGSize availableSize;

/**
 * Layout direction (LTR or RTL) inherited from native environment and
 * is using as a base direction value in layout engine.
 * Defaults to value inferred from current locale.
 */
@property (nonatomic, assign) ABI45_0_0YGDirection baseDirection;

- (void)layoutWithAffectedShadowViews:(NSHashTable<ABI45_0_0RCTShadowView *> *)affectedShadowViews;

@end
