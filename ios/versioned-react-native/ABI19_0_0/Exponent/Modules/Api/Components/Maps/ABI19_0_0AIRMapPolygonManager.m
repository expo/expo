/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI19_0_0AIRMapPolygonManager.h"

#import <ReactABI19_0_0/ABI19_0_0RCTBridge.h>
#import <ReactABI19_0_0/ABI19_0_0RCTConvert.h>
#import <ReactABI19_0_0/ABI19_0_0RCTConvert+CoreLocation.h>
#import <ReactABI19_0_0/ABI19_0_0RCTEventDispatcher.h>
#import <ReactABI19_0_0/ABI19_0_0RCTViewManager.h>
#import <ReactABI19_0_0/UIView+ReactABI19_0_0.h>
#import "ABI19_0_0RCTConvert+AirMap.h"
#import "ABI19_0_0AIRMapMarker.h"
#import "ABI19_0_0AIRMapPolygon.h"

@interface ABI19_0_0AIRMapPolygonManager()

@end

@implementation ABI19_0_0AIRMapPolygonManager

ABI19_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI19_0_0AIRMapPolygon *polygon = [ABI19_0_0AIRMapPolygon new];
    return polygon;
}

ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(coordinates, ABI19_0_0AIRMapCoordinateArray)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(holes, ABI19_0_0AIRMapCoordinateArrayArray)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, CGFloat)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(lineCap, CGLineCap)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(lineJoin, CGLineJoin)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(miterLimit, CGFloat)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(lineDashPhase, CGFloat)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(lineDashPattern, NSArray)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI19_0_0RCTBubblingEventBlock)


@end
