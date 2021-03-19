/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI41_0_0AIRMapPolylineManager.h"

#import <ABI41_0_0React/ABI41_0_0RCTBridge.h>
#import <ABI41_0_0React/ABI41_0_0RCTConvert.h>
#import <ABI41_0_0React/ABI41_0_0RCTConvert+CoreLocation.h>
#import <ABI41_0_0React/ABI41_0_0RCTEventDispatcher.h>
#import <ABI41_0_0React/ABI41_0_0RCTViewManager.h>
#import <ABI41_0_0React/ABI41_0_0UIView+React.h>
#import "ABI41_0_0RCTConvert+AirMap.h"
#import "ABI41_0_0AIRMapMarker.h"
#import "ABI41_0_0AIRMapPolyline.h"

@interface ABI41_0_0AIRMapPolylineManager()

@end

@implementation ABI41_0_0AIRMapPolylineManager

ABI41_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI41_0_0AIRMapPolyline *polyline = [ABI41_0_0AIRMapPolyline new];
    return polyline;
}

ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(coordinates, ABI41_0_0AIRMapCoordinateArray)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColors, UIColorArray)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, CGFloat)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(lineCap, CGLineCap)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(lineJoin, CGLineJoin)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(miterLimit, CGFloat)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(lineDashPhase, CGFloat)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(lineDashPattern, NSArray)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI41_0_0RCTBubblingEventBlock)

@end
