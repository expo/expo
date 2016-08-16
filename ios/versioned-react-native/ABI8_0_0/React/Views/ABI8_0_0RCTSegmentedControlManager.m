/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI8_0_0RCTSegmentedControlManager.h"

#import "ABI8_0_0RCTBridge.h"
#import "ABI8_0_0RCTConvert.h"
#import "ABI8_0_0RCTSegmentedControl.h"

@implementation ABI8_0_0RCTSegmentedControlManager

ABI8_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI8_0_0RCTSegmentedControl new];
}

ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(values, NSArray<NSString *>)
ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(selectedIndex, NSInteger)
ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor)
ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(momentary, BOOL)
ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(enabled, BOOL)
ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI8_0_0RCTBubblingEventBlock)

@end
