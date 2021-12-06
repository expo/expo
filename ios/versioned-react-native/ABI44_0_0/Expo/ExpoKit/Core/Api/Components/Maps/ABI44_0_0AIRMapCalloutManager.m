/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI44_0_0AIRMapCalloutManager.h"

#import <ABI44_0_0React/ABI44_0_0RCTBridge.h>
#import <ABI44_0_0React/ABI44_0_0RCTConvert.h>
#import <ABI44_0_0React/ABI44_0_0RCTConvert+CoreLocation.h>
#import <ABI44_0_0React/ABI44_0_0RCTEventDispatcher.h>
#import <ABI44_0_0React/ABI44_0_0RCTViewManager.h>
#import <ABI44_0_0React/ABI44_0_0UIView+React.h>
#import "ABI44_0_0AIRMapMarker.h"
#import "ABI44_0_0AIRMapCallout.h"

@interface ABI44_0_0AIRMapCalloutManager()

@end

@implementation ABI44_0_0AIRMapCalloutManager

ABI44_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    return [ABI44_0_0AIRMapCallout new];
}

ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(tooltip, BOOL)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI44_0_0RCTBubblingEventBlock)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(alphaHitTest, BOOL)

@end
