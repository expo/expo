/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI14_0_0AIRMapCalloutManager.h"

#import <ReactABI14_0_0/ABI14_0_0RCTBridge.h>
#import <ReactABI14_0_0/ABI14_0_0RCTConvert.h>
#import <ReactABI14_0_0/ABI14_0_0RCTConvert+CoreLocation.h>
#import <ReactABI14_0_0/ABI14_0_0RCTEventDispatcher.h>
#import <ReactABI14_0_0/ABI14_0_0RCTViewManager.h>
#import <ReactABI14_0_0/UIView+ReactABI14_0_0.h>
#import "ABI14_0_0AIRMapMarker.h"
#import "ABI14_0_0AIRMapCallout.h"

@interface ABI14_0_0AIRMapCalloutManager()

@end

@implementation ABI14_0_0AIRMapCalloutManager

ABI14_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    return [ABI14_0_0AIRMapCallout new];
}

ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(tooltip, BOOL)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI14_0_0RCTBubblingEventBlock)

@end
