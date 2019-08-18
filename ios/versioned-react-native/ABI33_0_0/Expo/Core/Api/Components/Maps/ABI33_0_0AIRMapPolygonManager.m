/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI33_0_0AIRMapPolygonManager.h"

#import <ReactABI33_0_0/ABI33_0_0RCTBridge.h>
#import <ReactABI33_0_0/ABI33_0_0RCTConvert.h>
#import <ReactABI33_0_0/ABI33_0_0RCTConvert+CoreLocation.h>
#import <ReactABI33_0_0/ABI33_0_0RCTEventDispatcher.h>
#import <ReactABI33_0_0/ABI33_0_0RCTViewManager.h>
#import <ReactABI33_0_0/UIView+ReactABI33_0_0.h>
#import "ABI33_0_0RCTConvert+AirMap.h"
#import "ABI33_0_0AIRMapMarker.h"
#import "ABI33_0_0AIRMapPolygon.h"

@interface ABI33_0_0AIRMapPolygonManager()

@end

@implementation ABI33_0_0AIRMapPolygonManager

ABI33_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI33_0_0AIRMapPolygon *polygon = [ABI33_0_0AIRMapPolygon new];
    return polygon;
}

ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(coordinates, ABI33_0_0AIRMapCoordinateArray)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(holes, ABI33_0_0AIRMapCoordinateArrayArray)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, CGFloat)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(lineCap, CGLineCap)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(lineJoin, CGLineJoin)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(miterLimit, CGFloat)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(lineDashPhase, CGFloat)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(lineDashPattern, NSArray)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI33_0_0RCTBubblingEventBlock)


@end
