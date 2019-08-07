/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI34_0_0RCTMaskedViewManager.h"

#import "ABI34_0_0RCTMaskedView.h"
#import "ABI34_0_0RCTUIManager.h"

@implementation ABI34_0_0RCTMaskedViewManager

ABI34_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI34_0_0RCTMaskedView new];
}

@end
