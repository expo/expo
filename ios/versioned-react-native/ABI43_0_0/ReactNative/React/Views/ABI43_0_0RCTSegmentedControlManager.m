/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI43_0_0RCTSegmentedControlManager.h"

#import "ABI43_0_0RCTBridge.h"
#import "ABI43_0_0RCTConvert.h"
#import "ABI43_0_0RCTSegmentedControl.h"

@implementation ABI43_0_0RCTSegmentedControlManager

ABI43_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI43_0_0RCTSegmentedControl new];
}

ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(values, NSArray<NSString *>)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(selectedIndex, NSInteger)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(backgroundColor, UIColor)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(textColor, UIColor)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(momentary, BOOL)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(enabled, BOOL)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI43_0_0RCTBubblingEventBlock)

@end
