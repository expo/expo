/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI14_0_0AIRMapPolygonManager.h"

#import <ReactABI14_0_0/ABI14_0_0RCTBridge.h>
#import <ReactABI14_0_0/ABI14_0_0RCTConvert.h>
#import <ReactABI14_0_0/ABI14_0_0RCTConvert+CoreLocation.h>
#import <ReactABI14_0_0/ABI14_0_0RCTEventDispatcher.h>
#import <ReactABI14_0_0/ABI14_0_0RCTViewManager.h>
#import <ReactABI14_0_0/UIView+ReactABI14_0_0.h>
#import "ABI14_0_0RCTConvert+MoreMapKit.h"
#import "ABI14_0_0AIRMapMarker.h"
#import "ABI14_0_0AIRMapPolygon.h"

@interface ABI14_0_0AIRMapPolygonManager()

@end

@implementation ABI14_0_0AIRMapPolygonManager

ABI14_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI14_0_0AIRMapPolygon *polygon = [ABI14_0_0AIRMapPolygon new];
    return polygon;
}

ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(coordinates, ABI14_0_0AIRMapCoordinateArray)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(holes, ABI14_0_0AIRMapCoordinateArrayArray)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, CGFloat)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(lineCap, CGLineCap)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(lineJoin, CGLineJoin)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(miterLimit, CGFloat)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(lineDashPhase, CGFloat)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(lineDashPattern, NSArray)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI14_0_0RCTBubblingEventBlock)


@end
