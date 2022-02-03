/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI44_0_0RCTSegmentedControlManager.h"

#import "ABI44_0_0RCTBridge.h"
#import "ABI44_0_0RCTConvert.h"
#import "ABI44_0_0RCTSegmentedControl.h"

@implementation ABI44_0_0RCTSegmentedControlManager

ABI44_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI44_0_0RCTSegmentedControl new];
}

ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(values, NSArray<NSString *>)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(selectedIndex, NSInteger)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(backgroundColor, UIColor)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(textColor, UIColor)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(momentary, BOOL)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(enabled, BOOL)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI44_0_0RCTBubblingEventBlock)

@end
