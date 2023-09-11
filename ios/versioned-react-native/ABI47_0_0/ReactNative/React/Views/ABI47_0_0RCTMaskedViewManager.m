/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI47_0_0RCTMaskedViewManager.h"

#import "ABI47_0_0RCTMaskedView.h"
#import "ABI47_0_0RCTUIManager.h"

@implementation ABI47_0_0RCTMaskedViewManager

ABI47_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI47_0_0RCTNewArchitectureValidationPlaceholder(
      ABI47_0_0RCTNotAllowedInFabricWithoutLegacy,
      self,
      @"This native component is still using the legacy interop layer -- please migrate it to use a Fabric specific implementation.");
  return [ABI47_0_0RCTMaskedView new];
}

@end
