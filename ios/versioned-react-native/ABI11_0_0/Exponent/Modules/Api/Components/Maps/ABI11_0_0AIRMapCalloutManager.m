/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI11_0_0AIRMapCalloutManager.h"

#import "ABI11_0_0RCTBridge.h"
#import "ABI11_0_0RCTConvert.h"
#import "ABI11_0_0RCTConvert+CoreLocation.h"
#import "ABI11_0_0RCTEventDispatcher.h"
#import "UIView+ReactABI11_0_0.h"
#import "ABI11_0_0AIRMapMarker.h"
#import "ABI11_0_0RCTViewManager.h"
#import "ABI11_0_0AIRMapCallout.h"

@interface ABI11_0_0AIRMapCalloutManager()

@end

@implementation ABI11_0_0AIRMapCalloutManager

ABI11_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    return [ABI11_0_0AIRMapCallout new];
}

ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(tooltip, BOOL)
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI11_0_0RCTBubblingEventBlock)

@end
