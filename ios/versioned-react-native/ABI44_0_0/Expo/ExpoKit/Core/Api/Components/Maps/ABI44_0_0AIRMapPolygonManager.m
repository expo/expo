/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI44_0_0AIRMapPolygonManager.h"

#import <ABI44_0_0React/ABI44_0_0RCTBridge.h>
#import <ABI44_0_0React/ABI44_0_0RCTConvert.h>
#import <ABI44_0_0React/ABI44_0_0RCTConvert+CoreLocation.h>
#import <ABI44_0_0React/ABI44_0_0RCTEventDispatcher.h>
#import <ABI44_0_0React/ABI44_0_0RCTViewManager.h>
#import <ABI44_0_0React/ABI44_0_0UIView+React.h>
#import "ABI44_0_0RCTConvert+AirMap.h"
#import "ABI44_0_0AIRMapMarker.h"
#import "ABI44_0_0AIRMapPolygon.h"

@interface ABI44_0_0AIRMapPolygonManager()

@end

@implementation ABI44_0_0AIRMapPolygonManager

ABI44_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI44_0_0AIRMapPolygon *polygon = [ABI44_0_0AIRMapPolygon new];
    return polygon;
}

ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(coordinates, ABI44_0_0AIRMapCoordinateArray)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(holes, ABI44_0_0AIRMapCoordinateArrayArray)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, CGFloat)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(lineCap, CGLineCap)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(lineJoin, CGLineJoin)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(miterLimit, CGFloat)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(lineDashPhase, CGFloat)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(lineDashPattern, NSArray)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI44_0_0RCTBubblingEventBlock)


@end
