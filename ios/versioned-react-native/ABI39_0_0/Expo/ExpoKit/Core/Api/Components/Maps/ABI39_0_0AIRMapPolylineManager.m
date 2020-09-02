/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI39_0_0AIRMapPolylineManager.h"

#import <ABI39_0_0React/ABI39_0_0RCTBridge.h>
#import <ABI39_0_0React/ABI39_0_0RCTConvert.h>
#import <ABI39_0_0React/ABI39_0_0RCTConvert+CoreLocation.h>
#import <ABI39_0_0React/ABI39_0_0RCTEventDispatcher.h>
#import <ABI39_0_0React/ABI39_0_0RCTViewManager.h>
#import <ABI39_0_0React/ABI39_0_0UIView+React.h>
#import "ABI39_0_0RCTConvert+AirMap.h"
#import "ABI39_0_0AIRMapMarker.h"
#import "ABI39_0_0AIRMapPolyline.h"

@interface ABI39_0_0AIRMapPolylineManager()

@end

@implementation ABI39_0_0AIRMapPolylineManager

ABI39_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI39_0_0AIRMapPolyline *polyline = [ABI39_0_0AIRMapPolyline new];
    return polyline;
}

ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(coordinates, ABI39_0_0AIRMapCoordinateArray)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColors, UIColorArray)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, CGFloat)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(lineCap, CGLineCap)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(lineJoin, CGLineJoin)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(miterLimit, CGFloat)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(lineDashPhase, CGFloat)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(lineDashPattern, NSArray)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI39_0_0RCTBubblingEventBlock)

@end
