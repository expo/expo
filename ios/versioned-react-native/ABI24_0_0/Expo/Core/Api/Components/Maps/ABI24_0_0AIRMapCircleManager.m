/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI24_0_0AIRMapCircleManager.h"

#import <ReactABI24_0_0/ABI24_0_0RCTBridge.h>
#import <ReactABI24_0_0/ABI24_0_0RCTConvert.h>
#import <ReactABI24_0_0/ABI24_0_0RCTConvert+CoreLocation.h>
#import <ReactABI24_0_0/ABI24_0_0RCTEventDispatcher.h>
#import <ReactABI24_0_0/ABI24_0_0RCTViewManager.h>
#import <ReactABI24_0_0/UIView+ReactABI24_0_0.h>
#import "ABI24_0_0AIRMapMarker.h"
#import "ABI24_0_0AIRMapCircle.h"

@interface ABI24_0_0AIRMapCircleManager()

@end

@implementation ABI24_0_0AIRMapCircleManager

ABI24_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI24_0_0AIRMapCircle *circle = [ABI24_0_0AIRMapCircle new];
    return circle;
}

ABI24_0_0RCT_REMAP_VIEW_PROPERTY(center, centerCoordinate, CLLocationCoordinate2D)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(radius, CLLocationDistance)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, CGFloat)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(lineCap, CGLineCap)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(lineJoin, CGLineJoin)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(miterLimit, CGFloat)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(lineDashPhase, CGFloat)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(lineDashPattern, NSArray)

// NOTE(lmr):
// for now, onPress events for overlays will be left unimplemented. Seems it is possible with some work, but
// it is difficult to achieve in both ios and android so I decided to leave it out.
//ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI24_0_0RCTBubblingEventBlock)

@end
