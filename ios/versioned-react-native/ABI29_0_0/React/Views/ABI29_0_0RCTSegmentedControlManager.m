/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI29_0_0RCTSegmentedControlManager.h"

#import "ABI29_0_0RCTBridge.h"
#import "ABI29_0_0RCTConvert.h"
#import "ABI29_0_0RCTSegmentedControl.h"

@implementation ABI29_0_0RCTSegmentedControlManager

ABI29_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI29_0_0RCTSegmentedControl new];
}

ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(values, NSArray<NSString *>)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(selectedIndex, NSInteger)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(momentary, BOOL)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(enabled, BOOL)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI29_0_0RCTBubblingEventBlock)

@end
