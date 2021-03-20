/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI41_0_0RCTSegmentedControlManager.h"

#import "ABI41_0_0RCTBridge.h"
#import "ABI41_0_0RCTConvert.h"
#import "ABI41_0_0RCTSegmentedControl.h"

@implementation ABI41_0_0RCTSegmentedControlManager

ABI41_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI41_0_0RCTSegmentedControl new];
}

ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(values, NSArray<NSString *>)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(selectedIndex, NSInteger)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(backgroundColor, UIColor)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(textColor, UIColor)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(momentary, BOOL)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(enabled, BOOL)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI41_0_0RCTBubblingEventBlock)

@end
