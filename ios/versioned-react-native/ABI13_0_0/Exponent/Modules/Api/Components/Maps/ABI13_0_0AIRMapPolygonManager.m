/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI13_0_0AIRMapPolygonManager.h"

#import <ReactABI13_0_0/ABI13_0_0RCTBridge.h>
#import <ReactABI13_0_0/ABI13_0_0RCTConvert.h>
#import <ReactABI13_0_0/ABI13_0_0RCTConvert+CoreLocation.h>
#import <ReactABI13_0_0/ABI13_0_0RCTEventDispatcher.h>
#import <ReactABI13_0_0/ABI13_0_0RCTViewManager.h>
#import <ReactABI13_0_0/UIView+ReactABI13_0_0.h>
#import "ABI13_0_0RCTConvert+MoreMapKit.h"
#import "ABI13_0_0AIRMapMarker.h"
#import "ABI13_0_0AIRMapPolygon.h"

@interface ABI13_0_0AIRMapPolygonManager()

@end

@implementation ABI13_0_0AIRMapPolygonManager

ABI13_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI13_0_0AIRMapPolygon *polygon = [ABI13_0_0AIRMapPolygon new];
    return polygon;
}

ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(coordinates, ABI13_0_0AIRMapCoordinateArray)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(holes, ABI13_0_0AIRMapCoordinateArrayArray)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, CGFloat)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(lineCap, CGLineCap)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(lineJoin, CGLineJoin)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(miterLimit, CGFloat)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(lineDashPhase, CGFloat)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(lineDashPattern, NSArray)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI13_0_0RCTBubblingEventBlock)


@end
