/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI45_0_0RNCMaskedViewManager.h"

#import "ABI45_0_0RNCMaskedView.h"

@implementation ABI45_0_0RNCMaskedViewManager

ABI45_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI45_0_0RNCMaskedView new];
}

@end
