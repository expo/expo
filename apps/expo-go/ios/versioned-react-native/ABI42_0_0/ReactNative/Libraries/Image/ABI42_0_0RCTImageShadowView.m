/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI42_0_0React/ABI42_0_0RCTImageShadowView.h>

#import <ABI42_0_0React/ABI42_0_0RCTLog.h>

@implementation ABI42_0_0RCTImageShadowView

- (BOOL)isYogaLeafNode
{
  return YES;
}

- (BOOL)canHaveSubviews
{
  return NO;
}

@end
