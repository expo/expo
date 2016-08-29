/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "AIRMapCalloutManager.h"

#import "RCTBridge.h"
#import "RCTConvert.h"
#import "RCTConvert+CoreLocation.h"
#import "RCTEventDispatcher.h"
#import "UIView+React.h"
#import "AIRMapMarker.h"
#import "RCTViewManager.h"
#import "AIRMapCallout.h"

@interface AIRMapCalloutManager()

@end

@implementation AIRMapCalloutManager

RCT_EXPORT_MODULE()

- (UIView *)view
{
    return [AIRMapCallout new];
}

RCT_EXPORT_VIEW_PROPERTY(tooltip, BOOL)
RCT_EXPORT_VIEW_PROPERTY(onPress, RCTBubblingEventBlock)

@end
