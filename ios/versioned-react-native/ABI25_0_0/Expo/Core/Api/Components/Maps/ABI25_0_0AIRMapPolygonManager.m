/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI25_0_0AIRMapPolygonManager.h"

#import <ReactABI25_0_0/ABI25_0_0RCTBridge.h>
#import <ReactABI25_0_0/ABI25_0_0RCTConvert.h>
#import <ReactABI25_0_0/ABI25_0_0RCTConvert+CoreLocation.h>
#import <ReactABI25_0_0/ABI25_0_0RCTEventDispatcher.h>
#import <ReactABI25_0_0/ABI25_0_0RCTViewManager.h>
#import <ReactABI25_0_0/UIView+ReactABI25_0_0.h>
#import "ABI25_0_0RCTConvert+AirMap.h"
#import "ABI25_0_0AIRMapMarker.h"
#import "ABI25_0_0AIRMapPolygon.h"

@interface ABI25_0_0AIRMapPolygonManager()

@end

@implementation ABI25_0_0AIRMapPolygonManager

ABI25_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI25_0_0AIRMapPolygon *polygon = [ABI25_0_0AIRMapPolygon new];
    return polygon;
}

ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(coordinates, ABI25_0_0AIRMapCoordinateArray)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(holes, ABI25_0_0AIRMapCoordinateArrayArray)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, CGFloat)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(lineCap, CGLineCap)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(lineJoin, CGLineJoin)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(miterLimit, CGFloat)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(lineDashPhase, CGFloat)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(lineDashPattern, NSArray)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI25_0_0RCTBubblingEventBlock)


@end
