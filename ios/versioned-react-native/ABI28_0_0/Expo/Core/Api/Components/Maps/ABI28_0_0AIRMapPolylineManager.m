/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI28_0_0AIRMapPolylineManager.h"

#import <ReactABI28_0_0/ABI28_0_0RCTBridge.h>
#import <ReactABI28_0_0/ABI28_0_0RCTConvert.h>
#import <ReactABI28_0_0/ABI28_0_0RCTConvert+CoreLocation.h>
#import <ReactABI28_0_0/ABI28_0_0RCTEventDispatcher.h>
#import <ReactABI28_0_0/ABI28_0_0RCTViewManager.h>
#import <ReactABI28_0_0/UIView+ReactABI28_0_0.h>
#import "ABI28_0_0RCTConvert+AirMap.h"
#import "ABI28_0_0AIRMapMarker.h"
#import "ABI28_0_0AIRMapPolyline.h"

@interface ABI28_0_0AIRMapPolylineManager()

@end

@implementation ABI28_0_0AIRMapPolylineManager

ABI28_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI28_0_0AIRMapPolyline *polyline = [ABI28_0_0AIRMapPolyline new];
    return polyline;
}

ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(coordinates, ABI28_0_0AIRMapCoordinateArray)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColors, UIColorArray)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, CGFloat)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(lineCap, CGLineCap)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(lineJoin, CGLineJoin)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(miterLimit, CGFloat)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(lineDashPhase, CGFloat)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(lineDashPattern, NSArray)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI28_0_0RCTBubblingEventBlock)

@end
