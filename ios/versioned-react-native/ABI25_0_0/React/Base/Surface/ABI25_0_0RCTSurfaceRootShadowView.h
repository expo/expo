/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <ReactABI25_0_0/ABI25_0_0RCTShadowView.h>
#import <ReactABI25_0_0/ABI25_0_0RCTSurfaceRootShadowViewDelegate.h>
#import <YogaABI25_0_0/ABI25_0_0YGEnums.h>

@interface ABI25_0_0RCTSurfaceRootShadowView : ABI25_0_0RCTShadowView

@property (nonatomic, assign, readonly) CGSize minimumSize;
@property (nonatomic, assign, readonly) CGSize maximumSize;

- (void)setMinimumSize:(CGSize)size maximumSize:(CGSize)maximumSize;

@property (nonatomic, assign, readonly) CGSize intrinsicSize;

@property (nonatomic, weak) id<ABI25_0_0RCTSurfaceRootShadowViewDelegate> delegate;

- (CGSize)sizeThatFitsMinimumSize:(CGSize)minimumSize
                      maximumSize:(CGSize)maximumSize;

/**
 * Layout direction (LTR or RTL) inherited from native environment and
 * is using as a base direction value in layout engine.
 * Defaults to value inferred from current locale.
 */
@property (nonatomic, assign) ABI25_0_0YGDirection baseDirection;

/**
 * Calculate all views whose frame needs updating after layout has been calculated.
 * Returns a set contains the shadowviews that need updating.
 */
- (NSSet<ABI25_0_0RCTShadowView *> *)collectViewsWithUpdatedFrames;

@end
