/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI31_0_0AIRMapPolygonManager.h"

#import <ReactABI31_0_0/ABI31_0_0RCTBridge.h>
#import <ReactABI31_0_0/ABI31_0_0RCTConvert.h>
#import <ReactABI31_0_0/ABI31_0_0RCTConvert+CoreLocation.h>
#import <ReactABI31_0_0/ABI31_0_0RCTEventDispatcher.h>
#import <ReactABI31_0_0/ABI31_0_0RCTViewManager.h>
#import <ReactABI31_0_0/UIView+ReactABI31_0_0.h>
#import "ABI31_0_0RCTConvert+AirMap.h"
#import "ABI31_0_0AIRMapMarker.h"
#import "ABI31_0_0AIRMapPolygon.h"

@interface ABI31_0_0AIRMapPolygonManager()

@end

@implementation ABI31_0_0AIRMapPolygonManager

ABI31_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI31_0_0AIRMapPolygon *polygon = [ABI31_0_0AIRMapPolygon new];
    return polygon;
}

ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(coordinates, ABI31_0_0AIRMapCoordinateArray)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(holes, ABI31_0_0AIRMapCoordinateArrayArray)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, CGFloat)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(lineCap, CGLineCap)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(lineJoin, CGLineJoin)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(miterLimit, CGFloat)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(lineDashPhase, CGFloat)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(lineDashPattern, NSArray)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI31_0_0RCTBubblingEventBlock)


@end
