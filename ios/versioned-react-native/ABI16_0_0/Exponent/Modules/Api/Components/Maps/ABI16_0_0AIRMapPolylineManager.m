/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI16_0_0AIRMapPolylineManager.h"

#import <ReactABI16_0_0/ABI16_0_0RCTBridge.h>
#import <ReactABI16_0_0/ABI16_0_0RCTConvert.h>
#import <ReactABI16_0_0/ABI16_0_0RCTConvert+CoreLocation.h>
#import <ReactABI16_0_0/ABI16_0_0RCTEventDispatcher.h>
#import <ReactABI16_0_0/ABI16_0_0RCTViewManager.h>
#import <ReactABI16_0_0/UIView+ReactABI16_0_0.h>
#import "ABI16_0_0RCTConvert+MoreMapKit.h"
#import "ABI16_0_0AIRMapMarker.h"
#import "ABI16_0_0AIRMapPolyline.h"

@interface ABI16_0_0AIRMapPolylineManager()

@end

@implementation ABI16_0_0AIRMapPolylineManager

ABI16_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI16_0_0AIRMapPolyline *polyline = [ABI16_0_0AIRMapPolyline new];
    return polyline;
}

ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(coordinates, ABI16_0_0AIRMapCoordinateArray)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, CGFloat)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(lineCap, CGLineCap)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(lineJoin, CGLineJoin)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(miterLimit, CGFloat)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(lineDashPhase, CGFloat)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(lineDashPattern, NSArray)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI16_0_0RCTBubblingEventBlock)

@end
