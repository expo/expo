/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI43_0_0RCTMaskedViewManager.h"

#import "ABI43_0_0RCTMaskedView.h"
#import "ABI43_0_0RCTUIManager.h"

@implementation ABI43_0_0RCTMaskedViewManager

ABI43_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI43_0_0RCTMaskedView new];
}

@end
