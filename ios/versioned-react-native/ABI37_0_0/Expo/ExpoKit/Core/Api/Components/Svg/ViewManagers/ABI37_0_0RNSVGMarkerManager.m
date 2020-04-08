/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI37_0_0RNSVGMarkerManager.h"
#import "ABI37_0_0RNSVGMarker.h"

@implementation ABI37_0_0RNSVGMarkerManager

ABI37_0_0RCT_EXPORT_MODULE()

- (ABI37_0_0RNSVGMarker *)node
{
    return [ABI37_0_0RNSVGMarker new];
}

ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(refX, ABI37_0_0RNSVGLength*)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(refY, ABI37_0_0RNSVGLength*)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(markerHeight, ABI37_0_0RNSVGLength*)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(markerWidth, ABI37_0_0RNSVGLength*)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(markerUnits, NSString*)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(orient, NSString*)

ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(minX, CGFloat)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(minY, CGFloat)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(vbWidth, CGFloat)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(vbHeight, CGFloat)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI37_0_0RNSVGVBMOS)

@end

