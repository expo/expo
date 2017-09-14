/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI21_0_0AIRMapCircleManager.h"

#import <ReactABI21_0_0/ABI21_0_0RCTBridge.h>
#import <ReactABI21_0_0/ABI21_0_0RCTConvert.h>
#import <ReactABI21_0_0/ABI21_0_0RCTConvert+CoreLocation.h>
#import <ReactABI21_0_0/ABI21_0_0RCTEventDispatcher.h>
#import <ReactABI21_0_0/ABI21_0_0RCTViewManager.h>
#import <ReactABI21_0_0/UIView+ReactABI21_0_0.h>
#import "ABI21_0_0AIRMapMarker.h"
#import "ABI21_0_0AIRMapCircle.h"

@interface ABI21_0_0AIRMapCircleManager()

@end

@implementation ABI21_0_0AIRMapCircleManager

ABI21_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI21_0_0AIRMapCircle *circle = [ABI21_0_0AIRMapCircle new];
    return circle;
}

ABI21_0_0RCT_REMAP_VIEW_PROPERTY(center, centerCoordinate, CLLocationCoordinate2D)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(radius, CLLocationDistance)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, CGFloat)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(lineCap, CGLineCap)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(lineJoin, CGLineJoin)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(miterLimit, CGFloat)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(lineDashPhase, CGFloat)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(lineDashPattern, NSArray)

// NOTE(lmr):
// for now, onPress events for overlays will be left unimplemented. Seems it is possible with some work, but
// it is difficult to achieve in both ios and android so I decided to leave it out.
//ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI21_0_0RCTBubblingEventBlock)

@end
