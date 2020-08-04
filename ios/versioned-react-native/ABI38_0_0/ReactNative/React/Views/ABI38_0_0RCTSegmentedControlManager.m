/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI38_0_0RCTSegmentedControlManager.h"

#import "ABI38_0_0RCTBridge.h"
#import "ABI38_0_0RCTConvert.h"
#import "ABI38_0_0RCTSegmentedControl.h"

@implementation ABI38_0_0RCTSegmentedControlManager

ABI38_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI38_0_0RCTSegmentedControl new];
}

ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(values, NSArray<NSString *>)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(selectedIndex, NSInteger)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(momentary, BOOL)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(enabled, BOOL)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI38_0_0RCTBubblingEventBlock)

@end
