/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI17_0_0RCTSegmentedControlManager.h"

#import "ABI17_0_0RCTBridge.h"
#import "ABI17_0_0RCTConvert.h"
#import "ABI17_0_0RCTSegmentedControl.h"

@implementation ABI17_0_0RCTSegmentedControlManager

ABI17_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI17_0_0RCTSegmentedControl new];
}

ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(values, NSArray<NSString *>)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(selectedIndex, NSInteger)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(momentary, BOOL)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(enabled, BOOL)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI17_0_0RCTBubblingEventBlock)

@end
