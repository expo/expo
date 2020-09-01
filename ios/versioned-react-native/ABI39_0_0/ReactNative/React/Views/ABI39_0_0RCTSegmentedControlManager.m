/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI39_0_0RCTSegmentedControlManager.h"

#import "ABI39_0_0RCTBridge.h"
#import "ABI39_0_0RCTConvert.h"
#import "ABI39_0_0RCTSegmentedControl.h"

@implementation ABI39_0_0RCTSegmentedControlManager

ABI39_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI39_0_0RCTSegmentedControl new];
}

ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(values, NSArray<NSString *>)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(selectedIndex, NSInteger)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(backgroundColor, UIColor)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(textColor, UIColor)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(momentary, BOOL)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(enabled, BOOL)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI39_0_0RCTBubblingEventBlock)

@end
