/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RNCMaskedViewManager.h"

#import "RNCMaskedView.h"

@implementation RNCMaskedViewManager

RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [RNCMaskedView new];
}

@end
