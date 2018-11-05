/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI26_0_0AIRMapPolygonManager.h"

#import <ReactABI26_0_0/ABI26_0_0RCTBridge.h>
#import <ReactABI26_0_0/ABI26_0_0RCTConvert.h>
#import <ReactABI26_0_0/ABI26_0_0RCTConvert+CoreLocation.h>
#import <ReactABI26_0_0/ABI26_0_0RCTEventDispatcher.h>
#import <ReactABI26_0_0/ABI26_0_0RCTViewManager.h>
#import <ReactABI26_0_0/UIView+ReactABI26_0_0.h>
#import "ABI26_0_0RCTConvert+AirMap.h"
#import "ABI26_0_0AIRMapMarker.h"
#import "ABI26_0_0AIRMapPolygon.h"

@interface ABI26_0_0AIRMapPolygonManager()

@end

@implementation ABI26_0_0AIRMapPolygonManager

ABI26_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI26_0_0AIRMapPolygon *polygon = [ABI26_0_0AIRMapPolygon new];
    return polygon;
}

ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(coordinates, ABI26_0_0AIRMapCoordinateArray)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(holes, ABI26_0_0AIRMapCoordinateArrayArray)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, CGFloat)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(lineCap, CGLineCap)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(lineJoin, CGLineJoin)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(miterLimit, CGFloat)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(lineDashPhase, CGFloat)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(lineDashPattern, NSArray)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI26_0_0RCTBubblingEventBlock)


@end
