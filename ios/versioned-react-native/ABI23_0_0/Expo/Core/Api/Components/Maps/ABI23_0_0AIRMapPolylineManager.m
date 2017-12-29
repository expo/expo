/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI23_0_0AIRMapPolylineManager.h"

#import <ReactABI23_0_0/ABI23_0_0RCTBridge.h>
#import <ReactABI23_0_0/ABI23_0_0RCTConvert.h>
#import <ReactABI23_0_0/ABI23_0_0RCTConvert+CoreLocation.h>
#import <ReactABI23_0_0/ABI23_0_0RCTEventDispatcher.h>
#import <ReactABI23_0_0/ABI23_0_0RCTViewManager.h>
#import <ReactABI23_0_0/UIView+ReactABI23_0_0.h>
#import "ABI23_0_0RCTConvert+AirMap.h"
#import "ABI23_0_0AIRMapMarker.h"
#import "ABI23_0_0AIRMapPolyline.h"

@interface ABI23_0_0AIRMapPolylineManager()

@end

@implementation ABI23_0_0AIRMapPolylineManager

ABI23_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI23_0_0AIRMapPolyline *polyline = [ABI23_0_0AIRMapPolyline new];
    return polyline;
}

ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(coordinates, ABI23_0_0AIRMapCoordinateArray)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, CGFloat)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(lineCap, CGLineCap)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(lineJoin, CGLineJoin)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(miterLimit, CGFloat)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(lineDashPhase, CGFloat)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(lineDashPattern, NSArray)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI23_0_0RCTBubblingEventBlock)

@end
