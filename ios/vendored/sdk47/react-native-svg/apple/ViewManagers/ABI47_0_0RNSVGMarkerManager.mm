/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI47_0_0RNSVGMarkerManager.h"
#import "ABI47_0_0RNSVGMarker.h"

@implementation ABI47_0_0RNSVGMarkerManager

ABI47_0_0RCT_EXPORT_MODULE()

- (ABI47_0_0RNSVGMarker *)node
{
  return [ABI47_0_0RNSVGMarker new];
}

ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(refX, ABI47_0_0RNSVGLength *)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(refY, ABI47_0_0RNSVGLength *)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(markerHeight, ABI47_0_0RNSVGLength *)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(markerWidth, ABI47_0_0RNSVGLength *)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(markerUnits, NSString *)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(orient, NSString *)

ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(minX, CGFloat)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(minY, CGFloat)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(vbWidth, CGFloat)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(vbHeight, CGFloat)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI47_0_0RNSVGVBMOS)

@end
