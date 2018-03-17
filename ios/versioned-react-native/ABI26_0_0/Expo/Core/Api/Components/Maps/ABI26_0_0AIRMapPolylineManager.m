/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI26_0_0AIRMapPolylineManager.h"

#import <ReactABI26_0_0/ABI26_0_0RCTBridge.h>
#import <ReactABI26_0_0/ABI26_0_0RCTConvert.h>
#import <ReactABI26_0_0/ABI26_0_0RCTConvert+CoreLocation.h>
#import <ReactABI26_0_0/ABI26_0_0RCTEventDispatcher.h>
#import <ReactABI26_0_0/ABI26_0_0RCTViewManager.h>
#import <ReactABI26_0_0/UIView+ReactABI26_0_0.h>
#import "ABI26_0_0RCTConvert+AirMap.h"
#import "ABI26_0_0AIRMapMarker.h"
#import "ABI26_0_0AIRMapPolyline.h"

@interface ABI26_0_0AIRMapPolylineManager()

@end

@implementation ABI26_0_0AIRMapPolylineManager

ABI26_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI26_0_0AIRMapPolyline *polyline = [ABI26_0_0AIRMapPolyline new];
    return polyline;
}

ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(coordinates, ABI26_0_0AIRMapCoordinateArray)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColors, UIColorArray)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, CGFloat)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(lineCap, CGLineCap)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(lineJoin, CGLineJoin)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(miterLimit, CGFloat)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(lineDashPhase, CGFloat)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(lineDashPattern, NSArray)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI26_0_0RCTBubblingEventBlock)

@end
