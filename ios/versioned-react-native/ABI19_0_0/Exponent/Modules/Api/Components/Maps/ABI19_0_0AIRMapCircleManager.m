/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI19_0_0AIRMapCircleManager.h"

#import <ReactABI19_0_0/ABI19_0_0RCTBridge.h>
#import <ReactABI19_0_0/ABI19_0_0RCTConvert.h>
#import <ReactABI19_0_0/ABI19_0_0RCTConvert+CoreLocation.h>
#import <ReactABI19_0_0/ABI19_0_0RCTEventDispatcher.h>
#import <ReactABI19_0_0/ABI19_0_0RCTViewManager.h>
#import <ReactABI19_0_0/UIView+ReactABI19_0_0.h>
#import "ABI19_0_0AIRMapMarker.h"
#import "ABI19_0_0AIRMapCircle.h"

@interface ABI19_0_0AIRMapCircleManager()

@end

@implementation ABI19_0_0AIRMapCircleManager

ABI19_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI19_0_0AIRMapCircle *circle = [ABI19_0_0AIRMapCircle new];
    return circle;
}

ABI19_0_0RCT_REMAP_VIEW_PROPERTY(center, centerCoordinate, CLLocationCoordinate2D)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(radius, CLLocationDistance)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, CGFloat)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(lineCap, CGLineCap)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(lineJoin, CGLineJoin)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(miterLimit, CGFloat)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(lineDashPhase, CGFloat)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(lineDashPattern, NSArray)

// NOTE(lmr):
// for now, onPress events for overlays will be left unimplemented. Seems it is possible with some work, but
// it is difficult to achieve in both ios and android so I decided to leave it out.
//ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI19_0_0RCTBubblingEventBlock)

@end
