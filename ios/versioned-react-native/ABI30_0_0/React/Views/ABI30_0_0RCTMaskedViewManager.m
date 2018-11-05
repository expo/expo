/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI30_0_0RCTMaskedViewManager.h"

#import "ABI30_0_0RCTMaskedView.h"
#import "ABI30_0_0RCTUIManager.h"

@implementation ABI30_0_0RCTMaskedViewManager

ABI30_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI30_0_0RCTMaskedView new];
}

@end
