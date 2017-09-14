/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI21_0_0RCTMaskedViewManager.h"

#import "ABI21_0_0RCTMaskedView.h"
#import "ABI21_0_0RCTUIManager.h"

@implementation ABI21_0_0RCTMaskedViewManager

ABI21_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI21_0_0RCTMaskedView new];
}

@end
