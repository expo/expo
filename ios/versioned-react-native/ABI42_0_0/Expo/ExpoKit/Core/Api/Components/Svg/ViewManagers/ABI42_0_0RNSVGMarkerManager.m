/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI42_0_0RNSVGMarkerManager.h"
#import "ABI42_0_0RNSVGMarker.h"

@implementation ABI42_0_0RNSVGMarkerManager

ABI42_0_0RCT_EXPORT_MODULE()

- (ABI42_0_0RNSVGMarker *)node
{
    return [ABI42_0_0RNSVGMarker new];
}

ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(refX, ABI42_0_0RNSVGLength*)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(refY, ABI42_0_0RNSVGLength*)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(markerHeight, ABI42_0_0RNSVGLength*)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(markerWidth, ABI42_0_0RNSVGLength*)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(markerUnits, NSString*)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(orient, NSString*)

ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(minX, CGFloat)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(minY, CGFloat)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(vbWidth, CGFloat)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(vbHeight, CGFloat)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI42_0_0RNSVGVBMOS)

@end

