/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI45_0_0AIRMapPolygonManager.h"

#import <ABI45_0_0React/ABI45_0_0RCTBridge.h>
#import <ABI45_0_0React/ABI45_0_0RCTConvert.h>
#import <ABI45_0_0React/ABI45_0_0RCTConvert+CoreLocation.h>
#import <ABI45_0_0React/ABI45_0_0RCTEventDispatcher.h>
#import <ABI45_0_0React/ABI45_0_0RCTViewManager.h>
#import <ABI45_0_0React/ABI45_0_0UIView+React.h>
#import "ABI45_0_0RCTConvert+AirMap.h"
#import "ABI45_0_0AIRMapMarker.h"
#import "ABI45_0_0AIRMapPolygon.h"

@interface ABI45_0_0AIRMapPolygonManager()

@end

@implementation ABI45_0_0AIRMapPolygonManager

ABI45_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI45_0_0AIRMapPolygon *polygon = [ABI45_0_0AIRMapPolygon new];
    return polygon;
}

ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(coordinates, ABI45_0_0AIRMapCoordinateArray)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(holes, ABI45_0_0AIRMapCoordinateArrayArray)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, CGFloat)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(lineCap, CGLineCap)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(lineJoin, CGLineJoin)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(miterLimit, CGFloat)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(lineDashPhase, CGFloat)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(lineDashPattern, NSArray)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI45_0_0RCTBubblingEventBlock)


@end
