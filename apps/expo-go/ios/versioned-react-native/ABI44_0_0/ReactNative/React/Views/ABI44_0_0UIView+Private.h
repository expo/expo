/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

@interface UIView (Private)

// remove clipped subviews implementation
- (void)ABI44_0_0React_remountAllSubviews;
- (void)ABI44_0_0React_updateClippedSubviewsWithClipRect:(CGRect)clipRect relativeToView:(UIView *)clipView;
- (UIView *)ABI44_0_0React_findClipView;

@end
