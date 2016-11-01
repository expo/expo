/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI11_0_0RCTShadowView.h"

@interface ABI11_0_0RCTRootShadowView : ABI11_0_0RCTShadowView

/**
 * Size flexibility type used to find size constraints.
 * Default to ABI11_0_0RCTRootViewSizeFlexibilityNone
 */
@property (nonatomic, assign) ABI11_0_0RCTRootViewSizeFlexibility sizeFlexibility;

/**
 * Calculate all views whose frame needs updating after layout has been calculated.
 * Returns a set contains the shadowviews that need updating.
 */
- (NSSet<ABI11_0_0RCTShadowView *> *)collectViewsWithUpdatedFrames;

@end
