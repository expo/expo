/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI38_0_0RCTRootShadowView.h"

#import "ABI38_0_0RCTI18nUtil.h"
#import "ABI38_0_0RCTShadowView+Layout.h"

@implementation ABI38_0_0RCTRootShadowView

- (instancetype)init
{
  if (self = [super init]) {
    _baseDirection = [[ABI38_0_0RCTI18nUtil sharedInstance] isRTL] ? ABI38_0_0YGDirectionRTL : ABI38_0_0YGDirectionLTR;
    _availableSize = CGSizeMake(INFINITY, INFINITY);
  }

  return self;
}

- (void)layoutWithAffectedShadowViews:(NSHashTable<ABI38_0_0RCTShadowView *> *)affectedShadowViews
{
  NSHashTable<NSString *> *other = [NSHashTable new];

  ABI38_0_0RCTLayoutContext layoutContext = {};
  layoutContext.absolutePosition = CGPointZero;
  layoutContext.affectedShadowViews = affectedShadowViews;
  layoutContext.other = other;

  [self layoutWithMinimumSize:CGSizeZero
                  maximumSize:_availableSize
              layoutDirection:ABI38_0_0RCTUIKitLayoutDirectionFromYogaLayoutDirection(_baseDirection)
                layoutContext:layoutContext];
}

@end
