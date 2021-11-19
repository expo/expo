/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI43_0_0RNSVGMarkerManager.h"
#import "ABI43_0_0RNSVGMarker.h"

@implementation ABI43_0_0RNSVGMarkerManager

ABI43_0_0RCT_EXPORT_MODULE()

- (ABI43_0_0RNSVGMarker *)node
{
    return [ABI43_0_0RNSVGMarker new];
}

ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(refX, ABI43_0_0RNSVGLength*)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(refY, ABI43_0_0RNSVGLength*)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(markerHeight, ABI43_0_0RNSVGLength*)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(markerWidth, ABI43_0_0RNSVGLength*)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(markerUnits, NSString*)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(orient, NSString*)

ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(minX, CGFloat)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(minY, CGFloat)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(vbWidth, CGFloat)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(vbHeight, CGFloat)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI43_0_0RNSVGVBMOS)

@end

