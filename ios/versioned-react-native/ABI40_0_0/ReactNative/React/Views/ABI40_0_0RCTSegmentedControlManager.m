/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI40_0_0RCTSegmentedControlManager.h"

#import "ABI40_0_0RCTBridge.h"
#import "ABI40_0_0RCTConvert.h"
#import "ABI40_0_0RCTSegmentedControl.h"

@implementation ABI40_0_0RCTSegmentedControlManager

ABI40_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI40_0_0RCTSegmentedControl new];
}

ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(values, NSArray<NSString *>)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(selectedIndex, NSInteger)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(backgroundColor, UIColor)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(textColor, UIColor)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(momentary, BOOL)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(enabled, BOOL)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI40_0_0RCTBubblingEventBlock)

@end
