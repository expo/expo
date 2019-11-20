/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI36_0_0RNSVGMarkerManager.h"
#import "ABI36_0_0RNSVGMarker.h"

@implementation ABI36_0_0RNSVGMarkerManager

ABI36_0_0RCT_EXPORT_MODULE()

- (ABI36_0_0RNSVGMarker *)node
{
    return [ABI36_0_0RNSVGMarker new];
}

ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(refX, ABI36_0_0RNSVGLength*)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(refY, ABI36_0_0RNSVGLength*)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(markerHeight, ABI36_0_0RNSVGLength*)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(markerWidth, ABI36_0_0RNSVGLength*)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(markerUnits, NSString*)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(orient, NSString*)

ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(minX, CGFloat)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(minY, CGFloat)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(vbWidth, CGFloat)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(vbHeight, CGFloat)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI36_0_0RNSVGVBMOS)

@end

