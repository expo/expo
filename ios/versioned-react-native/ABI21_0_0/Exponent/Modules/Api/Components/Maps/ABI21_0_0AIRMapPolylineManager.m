/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI21_0_0AIRMapPolylineManager.h"

#import <ReactABI21_0_0/ABI21_0_0RCTBridge.h>
#import <ReactABI21_0_0/ABI21_0_0RCTConvert.h>
#import <ReactABI21_0_0/ABI21_0_0RCTConvert+CoreLocation.h>
#import <ReactABI21_0_0/ABI21_0_0RCTEventDispatcher.h>
#import <ReactABI21_0_0/ABI21_0_0RCTViewManager.h>
#import <ReactABI21_0_0/UIView+ReactABI21_0_0.h>
#import "ABI21_0_0RCTConvert+AirMap.h"
#import "ABI21_0_0AIRMapMarker.h"
#import "ABI21_0_0AIRMapPolyline.h"

@interface ABI21_0_0AIRMapPolylineManager()

@end

@implementation ABI21_0_0AIRMapPolylineManager

ABI21_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI21_0_0AIRMapPolyline *polyline = [ABI21_0_0AIRMapPolyline new];
    return polyline;
}

ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(coordinates, ABI21_0_0AIRMapCoordinateArray)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, CGFloat)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(lineCap, CGLineCap)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(lineJoin, CGLineJoin)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(miterLimit, CGFloat)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(lineDashPhase, CGFloat)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(lineDashPattern, NSArray)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI21_0_0RCTBubblingEventBlock)

@end
