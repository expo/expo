/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI48_0_0AIRMapPolylineManager.h"

#import <ABI48_0_0React/ABI48_0_0RCTBridge.h>
#import <ABI48_0_0React/ABI48_0_0RCTConvert.h>
#import <ABI48_0_0React/ABI48_0_0RCTConvert+CoreLocation.h>
#import <ABI48_0_0React/ABI48_0_0RCTEventDispatcher.h>
#import <ABI48_0_0React/ABI48_0_0RCTViewManager.h>
#import <ABI48_0_0React/ABI48_0_0UIView+React.h>
#import "ABI48_0_0RCTConvert+AirMap.h"
#import "ABI48_0_0AIRMapMarker.h"
#import "ABI48_0_0AIRMapPolyline.h"

@interface ABI48_0_0AIRMapPolylineManager()

@end

@implementation ABI48_0_0AIRMapPolylineManager

ABI48_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI48_0_0AIRMapPolyline *polyline = [ABI48_0_0AIRMapPolyline new];
    return polyline;
}

ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(coordinates, ABI48_0_0AIRMapCoordinateArray)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColors, UIColorArray)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, CGFloat)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(lineCap, CGLineCap)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(lineJoin, CGLineJoin)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(miterLimit, CGFloat)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(lineDashPhase, CGFloat)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(lineDashPattern, NSArray)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(geodesic, BOOL)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI48_0_0RCTBubblingEventBlock)

@end
