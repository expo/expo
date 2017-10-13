/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI22_0_0AIRMapPolylineManager.h"

#import <ReactABI22_0_0/ABI22_0_0RCTBridge.h>
#import <ReactABI22_0_0/ABI22_0_0RCTConvert.h>
#import <ReactABI22_0_0/ABI22_0_0RCTConvert+CoreLocation.h>
#import <ReactABI22_0_0/ABI22_0_0RCTEventDispatcher.h>
#import <ReactABI22_0_0/ABI22_0_0RCTViewManager.h>
#import <ReactABI22_0_0/UIView+ReactABI22_0_0.h>
#import "ABI22_0_0RCTConvert+AirMap.h"
#import "ABI22_0_0AIRMapMarker.h"
#import "ABI22_0_0AIRMapPolyline.h"

@interface ABI22_0_0AIRMapPolylineManager()

@end

@implementation ABI22_0_0AIRMapPolylineManager

ABI22_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI22_0_0AIRMapPolyline *polyline = [ABI22_0_0AIRMapPolyline new];
    return polyline;
}

ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(coordinates, ABI22_0_0AIRMapCoordinateArray)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, CGFloat)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(lineCap, CGLineCap)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(lineJoin, CGLineJoin)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(miterLimit, CGFloat)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(lineDashPhase, CGFloat)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(lineDashPattern, NSArray)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI22_0_0RCTBubblingEventBlock)

@end
