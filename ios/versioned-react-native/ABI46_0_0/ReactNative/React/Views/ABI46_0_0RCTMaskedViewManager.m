/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI46_0_0RCTMaskedViewManager.h"

#import "ABI46_0_0RCTMaskedView.h"
#import "ABI46_0_0RCTUIManager.h"

@implementation ABI46_0_0RCTMaskedViewManager

ABI46_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI46_0_0RCTMaskedView new];
}

@end
