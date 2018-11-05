/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI27_0_0RCTSegmentedControlManager.h"

#import "ABI27_0_0RCTBridge.h"
#import "ABI27_0_0RCTConvert.h"
#import "ABI27_0_0RCTSegmentedControl.h"

@implementation ABI27_0_0RCTSegmentedControlManager

ABI27_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI27_0_0RCTSegmentedControl new];
}

ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(values, NSArray<NSString *>)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(selectedIndex, NSInteger)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(momentary, BOOL)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(enabled, BOOL)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI27_0_0RCTBubblingEventBlock)

@end
