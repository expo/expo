/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

@interface UIView (Private)

// remove clipped subviews implementation
- (void)ReactABI23_0_0_remountAllSubviews;
- (void)ReactABI23_0_0_updateClippedSubviewsWithClipRect:(CGRect)clipRect relativeToView:(UIView *)clipView;
- (UIView *)ReactABI23_0_0_findClipView;

@end
