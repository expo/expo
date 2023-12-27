/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI42_0_0RCTSegmentedControlManager.h"

#import "ABI42_0_0RCTBridge.h"
#import "ABI42_0_0RCTConvert.h"
#import "ABI42_0_0RCTSegmentedControl.h"

@implementation ABI42_0_0RCTSegmentedControlManager

ABI42_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI42_0_0RCTSegmentedControl new];
}

ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(values, NSArray<NSString *>)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(selectedIndex, NSInteger)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(backgroundColor, UIColor)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(textColor, UIColor)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(momentary, BOOL)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(enabled, BOOL)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI42_0_0RCTBubblingEventBlock)

@end
