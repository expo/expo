/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RNCSegmentedControlManager.h"

#import <React/RCTBridge.h>
#import <React/RCTConvert.h>
#import "RNCSegmentedControl.h"

@implementation RNCSegmentedControlManager

RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [RNCSegmentedControl new];
}

RCT_EXPORT_VIEW_PROPERTY(values, NSArray<NSString *>)
RCT_EXPORT_VIEW_PROPERTY(selectedIndex, NSInteger)
RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor)
RCT_EXPORT_VIEW_PROPERTY(backgroundColor, UIColor)
RCT_EXPORT_VIEW_PROPERTY(textColor, UIColor)
RCT_EXPORT_VIEW_PROPERTY(fontSize, NSInteger)
RCT_EXPORT_VIEW_PROPERTY(activeTextColor, UIColor)
RCT_EXPORT_VIEW_PROPERTY(momentary, BOOL)
RCT_EXPORT_VIEW_PROPERTY(enabled, BOOL)
RCT_EXPORT_VIEW_PROPERTY(onChange, RCTBubblingEventBlock)
RCT_EXPORT_VIEW_PROPERTY(appearance, NSString)

@end
