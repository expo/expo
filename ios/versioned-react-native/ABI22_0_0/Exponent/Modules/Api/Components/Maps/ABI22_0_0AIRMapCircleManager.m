/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI22_0_0AIRMapCircleManager.h"

#import <ReactABI22_0_0/ABI22_0_0RCTBridge.h>
#import <ReactABI22_0_0/ABI22_0_0RCTConvert.h>
#import <ReactABI22_0_0/ABI22_0_0RCTConvert+CoreLocation.h>
#import <ReactABI22_0_0/ABI22_0_0RCTEventDispatcher.h>
#import <ReactABI22_0_0/ABI22_0_0RCTViewManager.h>
#import <ReactABI22_0_0/UIView+ReactABI22_0_0.h>
#import "ABI22_0_0AIRMapMarker.h"
#import "ABI22_0_0AIRMapCircle.h"

@interface ABI22_0_0AIRMapCircleManager()

@end

@implementation ABI22_0_0AIRMapCircleManager

ABI22_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI22_0_0AIRMapCircle *circle = [ABI22_0_0AIRMapCircle new];
    return circle;
}

ABI22_0_0RCT_REMAP_VIEW_PROPERTY(center, centerCoordinate, CLLocationCoordinate2D)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(radius, CLLocationDistance)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, CGFloat)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(lineCap, CGLineCap)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(lineJoin, CGLineJoin)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(miterLimit, CGFloat)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(lineDashPhase, CGFloat)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(lineDashPattern, NSArray)

// NOTE(lmr):
// for now, onPress events for overlays will be left unimplemented. Seems it is possible with some work, but
// it is difficult to achieve in both ios and android so I decided to leave it out.
//ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI22_0_0RCTBubblingEventBlock)

@end
