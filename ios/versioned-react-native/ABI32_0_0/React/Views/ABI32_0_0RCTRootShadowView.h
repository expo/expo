/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ReactABI32_0_0/ABI32_0_0RCTShadowView.h>
#import <ABI32_0_0yoga/ABI32_0_0YGEnums.h>

@interface ABI32_0_0RCTRootShadowView : ABI32_0_0RCTShadowView

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
@property (nonatomic, assign) ABI32_0_0YGDirection baseDirection;

- (void)layoutWithAffectedShadowViews:(NSHashTable<ABI32_0_0RCTShadowView *> *)affectedShadowViews;

@end
