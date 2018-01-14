/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI25_0_0AIRMapCalloutManager.h"

#import <ReactABI25_0_0/ABI25_0_0RCTBridge.h>
#import <ReactABI25_0_0/ABI25_0_0RCTConvert.h>
#import <ReactABI25_0_0/ABI25_0_0RCTConvert+CoreLocation.h>
#import <ReactABI25_0_0/ABI25_0_0RCTEventDispatcher.h>
#import <ReactABI25_0_0/ABI25_0_0RCTViewManager.h>
#import <ReactABI25_0_0/UIView+ReactABI25_0_0.h>
#import "ABI25_0_0AIRMapMarker.h"
#import "ABI25_0_0AIRMapCallout.h"

@interface ABI25_0_0AIRMapCalloutManager()

@end

@implementation ABI25_0_0AIRMapCalloutManager

ABI25_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    return [ABI25_0_0AIRMapCallout new];
}

ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(tooltip, BOOL)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI25_0_0RCTBubblingEventBlock)

@end
