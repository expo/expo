/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI32_0_0AIRMapPolylineManager.h"

#import <ReactABI32_0_0/ABI32_0_0RCTBridge.h>
#import <ReactABI32_0_0/ABI32_0_0RCTConvert.h>
#import <ReactABI32_0_0/ABI32_0_0RCTConvert+CoreLocation.h>
#import <ReactABI32_0_0/ABI32_0_0RCTEventDispatcher.h>
#import <ReactABI32_0_0/ABI32_0_0RCTViewManager.h>
#import <ReactABI32_0_0/UIView+ReactABI32_0_0.h>
#import "ABI32_0_0RCTConvert+AirMap.h"
#import "ABI32_0_0AIRMapMarker.h"
#import "ABI32_0_0AIRMapPolyline.h"

@interface ABI32_0_0AIRMapPolylineManager()

@end

@implementation ABI32_0_0AIRMapPolylineManager

ABI32_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI32_0_0AIRMapPolyline *polyline = [ABI32_0_0AIRMapPolyline new];
    return polyline;
}

ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(coordinates, ABI32_0_0AIRMapCoordinateArray)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColors, UIColorArray)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, CGFloat)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(lineCap, CGLineCap)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(lineJoin, CGLineJoin)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(miterLimit, CGFloat)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(lineDashPhase, CGFloat)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(lineDashPattern, NSArray)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI32_0_0RCTBubblingEventBlock)

@end
