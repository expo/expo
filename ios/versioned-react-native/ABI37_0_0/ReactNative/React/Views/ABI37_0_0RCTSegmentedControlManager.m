/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI37_0_0RCTSegmentedControlManager.h"

#import "ABI37_0_0RCTBridge.h"
#import "ABI37_0_0RCTConvert.h"
#import "ABI37_0_0RCTSegmentedControl.h"

@implementation ABI37_0_0RCTSegmentedControlManager

ABI37_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI37_0_0RCTSegmentedControl new];
}

ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(values, NSArray<NSString *>)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(selectedIndex, NSInteger)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(momentary, BOOL)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(enabled, BOOL)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI37_0_0RCTBubblingEventBlock)

@end
