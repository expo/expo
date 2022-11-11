/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI47_0_0RCTSafeAreaViewLocalData.h"

@implementation ABI47_0_0RCTSafeAreaViewLocalData

- (instancetype)initWithInsets:(UIEdgeInsets)insets
{
  if (self = [super init]) {
    _insets = insets;
  }

  return self;
}

@end
