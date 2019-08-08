/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI33_0_0RCTSegmentedControlManager.h"

#import "ABI33_0_0RCTBridge.h"
#import "ABI33_0_0RCTConvert.h"
#import "ABI33_0_0RCTSegmentedControl.h"

@implementation ABI33_0_0RCTSegmentedControlManager

ABI33_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI33_0_0RCTSegmentedControl new];
}

ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(values, NSArray<NSString *>)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(selectedIndex, NSInteger)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(momentary, BOOL)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(enabled, BOOL)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI33_0_0RCTBubblingEventBlock)

@end
