/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI49_0_0RNSVGMarkerManager.h"
#import "ABI49_0_0RNSVGMarker.h"

@implementation ABI49_0_0RNSVGMarkerManager

ABI49_0_0RCT_EXPORT_MODULE()

- (ABI49_0_0RNSVGMarker *)node
{
  return [ABI49_0_0RNSVGMarker new];
}

ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(refX, ABI49_0_0RNSVGLength *)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(refY, ABI49_0_0RNSVGLength *)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(markerHeight, ABI49_0_0RNSVGLength *)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(markerWidth, ABI49_0_0RNSVGLength *)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(markerUnits, NSString *)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(orient, NSString *)

ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(minX, CGFloat)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(minY, CGFloat)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(vbWidth, CGFloat)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(vbHeight, CGFloat)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI49_0_0RNSVGVBMOS)

@end
