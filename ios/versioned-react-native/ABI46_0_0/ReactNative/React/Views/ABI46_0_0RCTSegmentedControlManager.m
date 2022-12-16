/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI46_0_0RCTSegmentedControlManager.h"

#import "ABI46_0_0RCTBridge.h"
#import "ABI46_0_0RCTConvert.h"
#import "ABI46_0_0RCTSegmentedControl.h"

@implementation ABI46_0_0RCTSegmentedControlManager

ABI46_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI46_0_0RCTSegmentedControl new];
}

ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(values, NSArray<NSString *>)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(selectedIndex, NSInteger)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(backgroundColor, UIColor)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(textColor, UIColor)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(momentary, BOOL)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(enabled, BOOL)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI46_0_0RCTBubblingEventBlock)

@end
