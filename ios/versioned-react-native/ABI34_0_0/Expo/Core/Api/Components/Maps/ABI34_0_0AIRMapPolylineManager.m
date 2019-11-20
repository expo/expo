/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI34_0_0AIRMapPolylineManager.h"

#import <ReactABI34_0_0/ABI34_0_0RCTBridge.h>
#import <ReactABI34_0_0/ABI34_0_0RCTConvert.h>
#import <ReactABI34_0_0/ABI34_0_0RCTConvert+CoreLocation.h>
#import <ReactABI34_0_0/ABI34_0_0RCTEventDispatcher.h>
#import <ReactABI34_0_0/ABI34_0_0RCTViewManager.h>
#import <ReactABI34_0_0/UIView+ReactABI34_0_0.h>
#import "ABI34_0_0RCTConvert+AirMap.h"
#import "ABI34_0_0AIRMapMarker.h"
#import "ABI34_0_0AIRMapPolyline.h"

@interface ABI34_0_0AIRMapPolylineManager()

@end

@implementation ABI34_0_0AIRMapPolylineManager

ABI34_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI34_0_0AIRMapPolyline *polyline = [ABI34_0_0AIRMapPolyline new];
    return polyline;
}

ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(coordinates, ABI34_0_0AIRMapCoordinateArray)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColors, UIColorArray)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, CGFloat)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(lineCap, CGLineCap)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(lineJoin, CGLineJoin)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(miterLimit, CGFloat)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(lineDashPhase, CGFloat)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(lineDashPattern, NSArray)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI34_0_0RCTBubblingEventBlock)

@end
