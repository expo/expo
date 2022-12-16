/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI46_0_0RNSVGMarkerManager.h"
#import "ABI46_0_0RNSVGMarker.h"

@implementation ABI46_0_0RNSVGMarkerManager

ABI46_0_0RCT_EXPORT_MODULE()

- (ABI46_0_0RNSVGMarker *)node
{
    return [ABI46_0_0RNSVGMarker new];
}

ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(refX, ABI46_0_0RNSVGLength*)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(refY, ABI46_0_0RNSVGLength*)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(markerHeight, ABI46_0_0RNSVGLength*)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(markerWidth, ABI46_0_0RNSVGLength*)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(markerUnits, NSString*)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(orient, NSString*)

ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(minX, CGFloat)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(minY, CGFloat)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(vbWidth, CGFloat)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(vbHeight, CGFloat)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI46_0_0RNSVGVBMOS)

@end

