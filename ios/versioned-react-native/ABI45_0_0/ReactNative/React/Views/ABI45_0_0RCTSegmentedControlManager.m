/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI45_0_0RCTSegmentedControlManager.h"

#import "ABI45_0_0RCTBridge.h"
#import "ABI45_0_0RCTConvert.h"
#import "ABI45_0_0RCTSegmentedControl.h"

@implementation ABI45_0_0RCTSegmentedControlManager

ABI45_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI45_0_0RCTSegmentedControl new];
}

ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(values, NSArray<NSString *>)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(selectedIndex, NSInteger)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(backgroundColor, UIColor)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(textColor, UIColor)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(momentary, BOOL)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(enabled, BOOL)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI45_0_0RCTBubblingEventBlock)

@end
