/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI20_0_0AIRMapCircleManager.h"

#import <ReactABI20_0_0/ABI20_0_0RCTBridge.h>
#import <ReactABI20_0_0/ABI20_0_0RCTConvert.h>
#import <ReactABI20_0_0/ABI20_0_0RCTConvert+CoreLocation.h>
#import <ReactABI20_0_0/ABI20_0_0RCTEventDispatcher.h>
#import <ReactABI20_0_0/ABI20_0_0RCTViewManager.h>
#import <ReactABI20_0_0/UIView+ReactABI20_0_0.h>
#import "ABI20_0_0AIRMapMarker.h"
#import "ABI20_0_0AIRMapCircle.h"

@interface ABI20_0_0AIRMapCircleManager()

@end

@implementation ABI20_0_0AIRMapCircleManager

ABI20_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI20_0_0AIRMapCircle *circle = [ABI20_0_0AIRMapCircle new];
    return circle;
}

ABI20_0_0RCT_REMAP_VIEW_PROPERTY(center, centerCoordinate, CLLocationCoordinate2D)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(radius, CLLocationDistance)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, CGFloat)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(lineCap, CGLineCap)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(lineJoin, CGLineJoin)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(miterLimit, CGFloat)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(lineDashPhase, CGFloat)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(lineDashPattern, NSArray)

// NOTE(lmr):
// for now, onPress events for overlays will be left unimplemented. Seems it is possible with some work, but
// it is difficult to achieve in both ios and android so I decided to leave it out.
//ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI20_0_0RCTBubblingEventBlock)

@end
