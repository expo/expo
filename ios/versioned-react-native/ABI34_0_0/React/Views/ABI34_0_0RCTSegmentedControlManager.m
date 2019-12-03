/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI34_0_0RCTSegmentedControlManager.h"

#import "ABI34_0_0RCTBridge.h"
#import "ABI34_0_0RCTConvert.h"
#import "ABI34_0_0RCTSegmentedControl.h"

@implementation ABI34_0_0RCTSegmentedControlManager

ABI34_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI34_0_0RCTSegmentedControl new];
}

ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(values, NSArray<NSString *>)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(selectedIndex, NSInteger)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(momentary, BOOL)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(enabled, BOOL)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI34_0_0RCTBubblingEventBlock)

@end
