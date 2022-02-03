/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI44_0_0RNCMaskedViewManager.h"

#import "ABI44_0_0RNCMaskedView.h"

@implementation ABI44_0_0RNCMaskedViewManager

ABI44_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI44_0_0RNCMaskedView new];
}

@end
