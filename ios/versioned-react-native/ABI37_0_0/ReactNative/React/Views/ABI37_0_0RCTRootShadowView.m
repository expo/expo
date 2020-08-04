/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI37_0_0RCTRootShadowView.h"

#import "ABI37_0_0RCTI18nUtil.h"
#import "ABI37_0_0RCTShadowView+Layout.h"

@implementation ABI37_0_0RCTRootShadowView

- (instancetype)init
{
  if (self = [super init]) {
    _baseDirection = [[ABI37_0_0RCTI18nUtil sharedInstance] isRTL] ? ABI37_0_0YGDirectionRTL : ABI37_0_0YGDirectionLTR;
    _availableSize = CGSizeMake(INFINITY, INFINITY);
  }

  return self;
}

- (void)layoutWithAffectedShadowViews:(NSHashTable<ABI37_0_0RCTShadowView *> *)affectedShadowViews
{
  NSHashTable<NSString *> *other = [NSHashTable new];

  ABI37_0_0RCTLayoutContext layoutContext = {};
  layoutContext.absolutePosition = CGPointZero;
  layoutContext.affectedShadowViews = affectedShadowViews;
  layoutContext.other = other;

  [self layoutWithMinimumSize:CGSizeZero
                  maximumSize:_availableSize
              layoutDirection:ABI37_0_0RCTUIKitLayoutDirectionFromYogaLayoutDirection(_baseDirection)
                layoutContext:layoutContext];
}

@end
