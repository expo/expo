/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI29_0_0AIRMapPolygonManager.h"

#import <ReactABI29_0_0/ABI29_0_0RCTBridge.h>
#import <ReactABI29_0_0/ABI29_0_0RCTConvert.h>
#import <ReactABI29_0_0/ABI29_0_0RCTConvert+CoreLocation.h>
#import <ReactABI29_0_0/ABI29_0_0RCTEventDispatcher.h>
#import <ReactABI29_0_0/ABI29_0_0RCTViewManager.h>
#import <ReactABI29_0_0/UIView+ReactABI29_0_0.h>
#import "ABI29_0_0RCTConvert+AirMap.h"
#import "ABI29_0_0AIRMapMarker.h"
#import "ABI29_0_0AIRMapPolygon.h"

@interface ABI29_0_0AIRMapPolygonManager()

@end

@implementation ABI29_0_0AIRMapPolygonManager

ABI29_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI29_0_0AIRMapPolygon *polygon = [ABI29_0_0AIRMapPolygon new];
    return polygon;
}

ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(coordinates, ABI29_0_0AIRMapCoordinateArray)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(holes, ABI29_0_0AIRMapCoordinateArrayArray)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, CGFloat)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(lineCap, CGLineCap)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(lineJoin, CGLineJoin)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(miterLimit, CGFloat)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(lineDashPhase, CGFloat)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(lineDashPattern, NSArray)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI29_0_0RCTBubblingEventBlock)


@end
