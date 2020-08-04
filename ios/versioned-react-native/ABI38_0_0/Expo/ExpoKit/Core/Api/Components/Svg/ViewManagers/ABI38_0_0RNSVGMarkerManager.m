/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI38_0_0RNSVGMarkerManager.h"
#import "ABI38_0_0RNSVGMarker.h"

@implementation ABI38_0_0RNSVGMarkerManager

ABI38_0_0RCT_EXPORT_MODULE()

- (ABI38_0_0RNSVGMarker *)node
{
    return [ABI38_0_0RNSVGMarker new];
}

ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(refX, ABI38_0_0RNSVGLength*)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(refY, ABI38_0_0RNSVGLength*)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(markerHeight, ABI38_0_0RNSVGLength*)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(markerWidth, ABI38_0_0RNSVGLength*)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(markerUnits, NSString*)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(orient, NSString*)

ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(minX, CGFloat)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(minY, CGFloat)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(vbWidth, CGFloat)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(vbHeight, CGFloat)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI38_0_0RNSVGVBMOS)

@end

