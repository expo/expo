/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI46_0_0AIRMapCalloutManager.h"

#import <ABI46_0_0React/ABI46_0_0RCTBridge.h>
#import <ABI46_0_0React/ABI46_0_0RCTConvert.h>
#import <ABI46_0_0React/ABI46_0_0RCTConvert+CoreLocation.h>
#import <ABI46_0_0React/ABI46_0_0RCTEventDispatcher.h>
#import <ABI46_0_0React/ABI46_0_0RCTViewManager.h>
#import <ABI46_0_0React/ABI46_0_0UIView+React.h>
#import "ABI46_0_0AIRMapMarker.h"
#import "ABI46_0_0AIRMapCallout.h"

@interface ABI46_0_0AIRMapCalloutManager()

@end

@implementation ABI46_0_0AIRMapCalloutManager

ABI46_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    return [ABI46_0_0AIRMapCallout new];
}

ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(tooltip, BOOL)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI46_0_0RCTBubblingEventBlock)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(alphaHitTest, BOOL)

@end
