/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI42_0_0AIRMapPolylineManager.h"

#import <ABI42_0_0React/ABI42_0_0RCTBridge.h>
#import <ABI42_0_0React/ABI42_0_0RCTConvert.h>
#import <ABI42_0_0React/ABI42_0_0RCTConvert+CoreLocation.h>
#import <ABI42_0_0React/ABI42_0_0RCTEventDispatcher.h>
#import <ABI42_0_0React/ABI42_0_0RCTViewManager.h>
#import <ABI42_0_0React/ABI42_0_0UIView+React.h>
#import "ABI42_0_0RCTConvert+AirMap.h"
#import "ABI42_0_0AIRMapMarker.h"
#import "ABI42_0_0AIRMapPolyline.h"

@interface ABI42_0_0AIRMapPolylineManager()

@end

@implementation ABI42_0_0AIRMapPolylineManager

ABI42_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI42_0_0AIRMapPolyline *polyline = [ABI42_0_0AIRMapPolyline new];
    return polyline;
}

ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(coordinates, ABI42_0_0AIRMapCoordinateArray)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColors, UIColorArray)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, CGFloat)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(lineCap, CGLineCap)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(lineJoin, CGLineJoin)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(miterLimit, CGFloat)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(lineDashPhase, CGFloat)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(lineDashPattern, NSArray)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI42_0_0RCTBubblingEventBlock)

@end
