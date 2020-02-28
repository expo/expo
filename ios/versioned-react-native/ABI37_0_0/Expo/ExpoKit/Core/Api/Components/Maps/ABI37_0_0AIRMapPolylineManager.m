/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI37_0_0AIRMapPolylineManager.h"

#import <ABI37_0_0React/ABI37_0_0RCTBridge.h>
#import <ABI37_0_0React/ABI37_0_0RCTConvert.h>
#import <ABI37_0_0React/ABI37_0_0RCTConvert+CoreLocation.h>
#import <ABI37_0_0React/ABI37_0_0RCTEventDispatcher.h>
#import <ABI37_0_0React/ABI37_0_0RCTViewManager.h>
#import <ABI37_0_0React/ABI37_0_0UIView+React.h>
#import "ABI37_0_0RCTConvert+AirMap.h"
#import "ABI37_0_0AIRMapMarker.h"
#import "ABI37_0_0AIRMapPolyline.h"

@interface ABI37_0_0AIRMapPolylineManager()

@end

@implementation ABI37_0_0AIRMapPolylineManager

ABI37_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI37_0_0AIRMapPolyline *polyline = [ABI37_0_0AIRMapPolyline new];
    return polyline;
}

ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(coordinates, ABI37_0_0AIRMapCoordinateArray)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColors, UIColorArray)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, CGFloat)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(lineCap, CGLineCap)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(lineJoin, CGLineJoin)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(miterLimit, CGFloat)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(lineDashPhase, CGFloat)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(lineDashPattern, NSArray)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI37_0_0RCTBubblingEventBlock)

@end
