/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI41_0_0AIRMapCircleManager.h"

#import <ABI41_0_0React/ABI41_0_0RCTBridge.h>
#import <ABI41_0_0React/ABI41_0_0RCTConvert.h>
#import <ABI41_0_0React/ABI41_0_0RCTConvert+CoreLocation.h>
#import <ABI41_0_0React/ABI41_0_0RCTEventDispatcher.h>
#import <ABI41_0_0React/ABI41_0_0RCTViewManager.h>
#import <ABI41_0_0React/ABI41_0_0UIView+React.h>
#import "ABI41_0_0AIRMapMarker.h"
#import "ABI41_0_0AIRMapCircle.h"

@interface ABI41_0_0AIRMapCircleManager()

@end

@implementation ABI41_0_0AIRMapCircleManager

ABI41_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI41_0_0AIRMapCircle *circle = [ABI41_0_0AIRMapCircle new];
    return circle;
}

ABI41_0_0RCT_REMAP_VIEW_PROPERTY(center, centerCoordinate, CLLocationCoordinate2D)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(radius, CLLocationDistance)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, CGFloat)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(lineCap, CGLineCap)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(lineJoin, CGLineJoin)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(miterLimit, CGFloat)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(lineDashPhase, CGFloat)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(lineDashPattern, NSArray)

// NOTE(lmr):
// for now, onPress events for overlays will be left unimplemented. Seems it is possible with some work, but
// it is difficult to achieve in both ios and android so I decided to leave it out.
//ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI41_0_0RCTBubblingEventBlock)

@end
