/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI24_0_0AIRMapPolylineManager.h"

#import <ReactABI24_0_0/ABI24_0_0RCTBridge.h>
#import <ReactABI24_0_0/ABI24_0_0RCTConvert.h>
#import <ReactABI24_0_0/ABI24_0_0RCTConvert+CoreLocation.h>
#import <ReactABI24_0_0/ABI24_0_0RCTEventDispatcher.h>
#import <ReactABI24_0_0/ABI24_0_0RCTViewManager.h>
#import <ReactABI24_0_0/UIView+ReactABI24_0_0.h>
#import "ABI24_0_0RCTConvert+AirMap.h"
#import "ABI24_0_0AIRMapMarker.h"
#import "ABI24_0_0AIRMapPolyline.h"

@interface ABI24_0_0AIRMapPolylineManager()

@end

@implementation ABI24_0_0AIRMapPolylineManager

ABI24_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI24_0_0AIRMapPolyline *polyline = [ABI24_0_0AIRMapPolyline new];
    return polyline;
}

ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(coordinates, ABI24_0_0AIRMapCoordinateArray)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, CGFloat)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(lineCap, CGLineCap)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(lineJoin, CGLineJoin)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(miterLimit, CGFloat)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(lineDashPhase, CGFloat)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(lineDashPattern, NSArray)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI24_0_0RCTBubblingEventBlock)

@end
