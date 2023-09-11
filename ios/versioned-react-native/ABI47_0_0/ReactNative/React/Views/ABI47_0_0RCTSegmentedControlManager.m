/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI47_0_0RCTSegmentedControlManager.h"

#import "ABI47_0_0RCTBridge.h"
#import "ABI47_0_0RCTConvert.h"
#import "ABI47_0_0RCTSegmentedControl.h"

@implementation ABI47_0_0RCTSegmentedControlManager

ABI47_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI47_0_0RCTNewArchitectureValidationPlaceholder(
      ABI47_0_0RCTNotAllowedInFabricWithoutLegacy,
      self,
      @"This native component is still using the legacy interop layer -- please migrate it to use a Fabric specific implementation.");
  return [ABI47_0_0RCTSegmentedControl new];
}

ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(values, NSArray<NSString *>)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(selectedIndex, NSInteger)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(backgroundColor, UIColor)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(textColor, UIColor)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(momentary, BOOL)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(enabled, BOOL)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI47_0_0RCTBubblingEventBlock)

@end
