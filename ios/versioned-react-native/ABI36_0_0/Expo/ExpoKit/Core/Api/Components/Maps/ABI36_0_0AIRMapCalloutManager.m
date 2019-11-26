/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI36_0_0AIRMapCalloutManager.h"

#import <ABI36_0_0React/ABI36_0_0RCTBridge.h>
#import <ABI36_0_0React/ABI36_0_0RCTConvert.h>
#import <ABI36_0_0React/ABI36_0_0RCTConvert+CoreLocation.h>
#import <ABI36_0_0React/ABI36_0_0RCTEventDispatcher.h>
#import <ABI36_0_0React/ABI36_0_0RCTViewManager.h>
#import <ABI36_0_0React/ABI36_0_0UIView+React.h>
#import "ABI36_0_0AIRMapMarker.h"
#import "ABI36_0_0AIRMapCallout.h"

@interface ABI36_0_0AIRMapCalloutManager()

@end

@implementation ABI36_0_0AIRMapCalloutManager

ABI36_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    return [ABI36_0_0AIRMapCallout new];
}

ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(tooltip, BOOL)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI36_0_0RCTBubblingEventBlock)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(alphaHitTest, BOOL)

@end
