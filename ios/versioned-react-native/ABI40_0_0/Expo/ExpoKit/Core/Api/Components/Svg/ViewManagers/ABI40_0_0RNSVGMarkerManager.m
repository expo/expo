/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI40_0_0RNSVGMarkerManager.h"
#import "ABI40_0_0RNSVGMarker.h"

@implementation ABI40_0_0RNSVGMarkerManager

ABI40_0_0RCT_EXPORT_MODULE()

- (ABI40_0_0RNSVGMarker *)node
{
    return [ABI40_0_0RNSVGMarker new];
}

ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(refX, ABI40_0_0RNSVGLength*)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(refY, ABI40_0_0RNSVGLength*)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(markerHeight, ABI40_0_0RNSVGLength*)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(markerWidth, ABI40_0_0RNSVGLength*)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(markerUnits, NSString*)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(orient, NSString*)

ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(minX, CGFloat)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(minY, CGFloat)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(vbWidth, CGFloat)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(vbHeight, CGFloat)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI40_0_0RNSVGVBMOS)

@end

