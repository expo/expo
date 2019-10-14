/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI35_0_0RCTSegmentedControlManager.h"

#import "ABI35_0_0RCTBridge.h"
#import "ABI35_0_0RCTConvert.h"
#import "ABI35_0_0RCTSegmentedControl.h"

@implementation ABI35_0_0RCTSegmentedControlManager

ABI35_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI35_0_0RCTSegmentedControl new];
}

ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(values, NSArray<NSString *>)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(selectedIndex, NSInteger)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(momentary, BOOL)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(enabled, BOOL)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI35_0_0RCTBubblingEventBlock)

@end
