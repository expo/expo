/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI27_0_0AIRMapPolylineManager.h"

#import <ReactABI27_0_0/ABI27_0_0RCTBridge.h>
#import <ReactABI27_0_0/ABI27_0_0RCTConvert.h>
#import <ReactABI27_0_0/ABI27_0_0RCTConvert+CoreLocation.h>
#import <ReactABI27_0_0/ABI27_0_0RCTEventDispatcher.h>
#import <ReactABI27_0_0/ABI27_0_0RCTViewManager.h>
#import <ReactABI27_0_0/UIView+ReactABI27_0_0.h>
#import "ABI27_0_0RCTConvert+AirMap.h"
#import "ABI27_0_0AIRMapMarker.h"
#import "ABI27_0_0AIRMapPolyline.h"

@interface ABI27_0_0AIRMapPolylineManager()

@end

@implementation ABI27_0_0AIRMapPolylineManager

ABI27_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI27_0_0AIRMapPolyline *polyline = [ABI27_0_0AIRMapPolyline new];
    return polyline;
}

ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(coordinates, ABI27_0_0AIRMapCoordinateArray)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColors, UIColorArray)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, CGFloat)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(lineCap, CGLineCap)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(lineJoin, CGLineJoin)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(miterLimit, CGFloat)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(lineDashPhase, CGFloat)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(lineDashPattern, NSArray)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI27_0_0RCTBubblingEventBlock)

@end
