/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI43_0_0React/ABI43_0_0RCTShadowView.h>
#import <ABI43_0_0yoga/ABI43_0_0YGEnums.h>

@interface ABI43_0_0RCTRootShadowView : ABI43_0_0RCTShadowView

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
@property (nonatomic, assign) ABI43_0_0YGDirection baseDirection;

- (void)layoutWithAffectedShadowViews:(NSHashTable<ABI43_0_0RCTShadowView *> *)affectedShadowViews;

@end
