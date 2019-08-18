/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI32_0_0AIRMapPolygonManager.h"

#import <ReactABI32_0_0/ABI32_0_0RCTBridge.h>
#import <ReactABI32_0_0/ABI32_0_0RCTConvert.h>
#import <ReactABI32_0_0/ABI32_0_0RCTConvert+CoreLocation.h>
#import <ReactABI32_0_0/ABI32_0_0RCTEventDispatcher.h>
#import <ReactABI32_0_0/ABI32_0_0RCTViewManager.h>
#import <ReactABI32_0_0/UIView+ReactABI32_0_0.h>
#import "ABI32_0_0RCTConvert+AirMap.h"
#import "ABI32_0_0AIRMapMarker.h"
#import "ABI32_0_0AIRMapPolygon.h"

@interface ABI32_0_0AIRMapPolygonManager()

@end

@implementation ABI32_0_0AIRMapPolygonManager

ABI32_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI32_0_0AIRMapPolygon *polygon = [ABI32_0_0AIRMapPolygon new];
    return polygon;
}

ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(coordinates, ABI32_0_0AIRMapCoordinateArray)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(holes, ABI32_0_0AIRMapCoordinateArrayArray)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, CGFloat)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(lineCap, CGLineCap)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(lineJoin, CGLineJoin)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(miterLimit, CGFloat)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(lineDashPhase, CGFloat)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(lineDashPattern, NSArray)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI32_0_0RCTBubblingEventBlock)


@end
