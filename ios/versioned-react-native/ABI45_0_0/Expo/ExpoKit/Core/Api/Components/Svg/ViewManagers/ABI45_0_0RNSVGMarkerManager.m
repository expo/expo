/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI45_0_0RNSVGMarkerManager.h"
#import "ABI45_0_0RNSVGMarker.h"

@implementation ABI45_0_0RNSVGMarkerManager

ABI45_0_0RCT_EXPORT_MODULE()

- (ABI45_0_0RNSVGMarker *)node
{
    return [ABI45_0_0RNSVGMarker new];
}

ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(refX, ABI45_0_0RNSVGLength*)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(refY, ABI45_0_0RNSVGLength*)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(markerHeight, ABI45_0_0RNSVGLength*)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(markerWidth, ABI45_0_0RNSVGLength*)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(markerUnits, NSString*)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(orient, NSString*)

ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(minX, CGFloat)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(minY, CGFloat)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(vbWidth, CGFloat)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(vbHeight, CGFloat)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI45_0_0RNSVGVBMOS)

@end

