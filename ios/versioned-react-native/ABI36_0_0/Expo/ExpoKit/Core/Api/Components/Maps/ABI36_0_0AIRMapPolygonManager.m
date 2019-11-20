/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI36_0_0AIRMapPolygonManager.h"

#import <ABI36_0_0React/ABI36_0_0RCTBridge.h>
#import <ABI36_0_0React/ABI36_0_0RCTConvert.h>
#import <ABI36_0_0React/ABI36_0_0RCTConvert+CoreLocation.h>
#import <ABI36_0_0React/ABI36_0_0RCTEventDispatcher.h>
#import <ABI36_0_0React/ABI36_0_0RCTViewManager.h>
#import <ABI36_0_0React/ABI36_0_0UIView+React.h>
#import "ABI36_0_0RCTConvert+AirMap.h"
#import "ABI36_0_0AIRMapMarker.h"
#import "ABI36_0_0AIRMapPolygon.h"

@interface ABI36_0_0AIRMapPolygonManager()

@end

@implementation ABI36_0_0AIRMapPolygonManager

ABI36_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI36_0_0AIRMapPolygon *polygon = [ABI36_0_0AIRMapPolygon new];
    return polygon;
}

ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(coordinates, ABI36_0_0AIRMapCoordinateArray)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(holes, ABI36_0_0AIRMapCoordinateArrayArray)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, CGFloat)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(lineCap, CGLineCap)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(lineJoin, CGLineJoin)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(miterLimit, CGFloat)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(lineDashPhase, CGFloat)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(lineDashPattern, NSArray)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI36_0_0RCTBubblingEventBlock)


@end
