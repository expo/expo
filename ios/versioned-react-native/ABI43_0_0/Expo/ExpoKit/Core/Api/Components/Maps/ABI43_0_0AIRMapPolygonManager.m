/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI43_0_0AIRMapPolygonManager.h"

#import <ABI43_0_0React/ABI43_0_0RCTBridge.h>
#import <ABI43_0_0React/ABI43_0_0RCTConvert.h>
#import <ABI43_0_0React/ABI43_0_0RCTConvert+CoreLocation.h>
#import <ABI43_0_0React/ABI43_0_0RCTEventDispatcher.h>
#import <ABI43_0_0React/ABI43_0_0RCTViewManager.h>
#import <ABI43_0_0React/ABI43_0_0UIView+React.h>
#import "ABI43_0_0RCTConvert+AirMap.h"
#import "ABI43_0_0AIRMapMarker.h"
#import "ABI43_0_0AIRMapPolygon.h"

@interface ABI43_0_0AIRMapPolygonManager()

@end

@implementation ABI43_0_0AIRMapPolygonManager

ABI43_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI43_0_0AIRMapPolygon *polygon = [ABI43_0_0AIRMapPolygon new];
    return polygon;
}

ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(coordinates, ABI43_0_0AIRMapCoordinateArray)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(holes, ABI43_0_0AIRMapCoordinateArrayArray)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, CGFloat)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(lineCap, CGLineCap)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(lineJoin, CGLineJoin)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(miterLimit, CGFloat)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(lineDashPhase, CGFloat)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(lineDashPattern, NSArray)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI43_0_0RCTBubblingEventBlock)


@end
