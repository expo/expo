/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI48_0_0RNSVGMarkerManager.h"
#import "ABI48_0_0RNSVGMarker.h"

@implementation ABI48_0_0RNSVGMarkerManager

ABI48_0_0RCT_EXPORT_MODULE()

- (ABI48_0_0RNSVGMarker *)node
{
  return [ABI48_0_0RNSVGMarker new];
}

ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(refX, ABI48_0_0RNSVGLength *)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(refY, ABI48_0_0RNSVGLength *)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(markerHeight, ABI48_0_0RNSVGLength *)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(markerWidth, ABI48_0_0RNSVGLength *)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(markerUnits, NSString *)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(orient, NSString *)

ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(minX, CGFloat)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(minY, CGFloat)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(vbWidth, CGFloat)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(vbHeight, CGFloat)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI48_0_0RNSVGVBMOS)

@end
