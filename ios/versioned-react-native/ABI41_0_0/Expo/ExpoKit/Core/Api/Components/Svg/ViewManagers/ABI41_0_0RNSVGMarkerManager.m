/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI41_0_0RNSVGMarkerManager.h"
#import "ABI41_0_0RNSVGMarker.h"

@implementation ABI41_0_0RNSVGMarkerManager

ABI41_0_0RCT_EXPORT_MODULE()

- (ABI41_0_0RNSVGMarker *)node
{
    return [ABI41_0_0RNSVGMarker new];
}

ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(refX, ABI41_0_0RNSVGLength*)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(refY, ABI41_0_0RNSVGLength*)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(markerHeight, ABI41_0_0RNSVGLength*)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(markerWidth, ABI41_0_0RNSVGLength*)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(markerUnits, NSString*)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(orient, NSString*)

ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(minX, CGFloat)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(minY, CGFloat)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(vbWidth, CGFloat)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(vbHeight, CGFloat)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI41_0_0RNSVGVBMOS)

@end

