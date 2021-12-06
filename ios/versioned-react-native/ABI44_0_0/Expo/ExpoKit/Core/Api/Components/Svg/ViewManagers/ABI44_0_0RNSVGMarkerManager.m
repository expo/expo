/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI44_0_0RNSVGMarkerManager.h"
#import "ABI44_0_0RNSVGMarker.h"

@implementation ABI44_0_0RNSVGMarkerManager

ABI44_0_0RCT_EXPORT_MODULE()

- (ABI44_0_0RNSVGMarker *)node
{
    return [ABI44_0_0RNSVGMarker new];
}

ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(refX, ABI44_0_0RNSVGLength*)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(refY, ABI44_0_0RNSVGLength*)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(markerHeight, ABI44_0_0RNSVGLength*)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(markerWidth, ABI44_0_0RNSVGLength*)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(markerUnits, NSString*)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(orient, NSString*)

ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(minX, CGFloat)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(minY, CGFloat)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(vbWidth, CGFloat)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(vbHeight, CGFloat)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI44_0_0RNSVGVBMOS)

@end

