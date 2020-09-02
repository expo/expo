/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI39_0_0RNSVGMarkerManager.h"
#import "ABI39_0_0RNSVGMarker.h"

@implementation ABI39_0_0RNSVGMarkerManager

ABI39_0_0RCT_EXPORT_MODULE()

- (ABI39_0_0RNSVGMarker *)node
{
    return [ABI39_0_0RNSVGMarker new];
}

ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(refX, ABI39_0_0RNSVGLength*)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(refY, ABI39_0_0RNSVGLength*)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(markerHeight, ABI39_0_0RNSVGLength*)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(markerWidth, ABI39_0_0RNSVGLength*)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(markerUnits, NSString*)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(orient, NSString*)

ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(minX, CGFloat)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(minY, CGFloat)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(vbWidth, CGFloat)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(vbHeight, CGFloat)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI39_0_0RNSVGVBMOS)

@end

