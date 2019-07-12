/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI31_0_0RCTSegmentedControlManager.h"

#import "ABI31_0_0RCTBridge.h"
#import "ABI31_0_0RCTConvert.h"
#import "ABI31_0_0RCTSegmentedControl.h"

@implementation ABI31_0_0RCTSegmentedControlManager

ABI31_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI31_0_0RCTSegmentedControl new];
}

ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(values, NSArray<NSString *>)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(selectedIndex, NSInteger)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(momentary, BOOL)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(enabled, BOOL)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI31_0_0RCTBubblingEventBlock)

@end
