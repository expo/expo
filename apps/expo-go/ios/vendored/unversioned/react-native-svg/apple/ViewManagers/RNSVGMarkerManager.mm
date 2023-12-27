/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RNSVGMarkerManager.h"
#import "RNSVGMarker.h"

@implementation RNSVGMarkerManager

RCT_EXPORT_MODULE()

- (RNSVGMarker *)node
{
  return [RNSVGMarker new];
}

RCT_EXPORT_VIEW_PROPERTY(refX, RNSVGLength *)
RCT_EXPORT_VIEW_PROPERTY(refY, RNSVGLength *)
RCT_EXPORT_VIEW_PROPERTY(markerHeight, RNSVGLength *)
RCT_EXPORT_VIEW_PROPERTY(markerWidth, RNSVGLength *)
RCT_EXPORT_VIEW_PROPERTY(markerUnits, NSString *)
RCT_EXPORT_VIEW_PROPERTY(orient, NSString *)

RCT_EXPORT_VIEW_PROPERTY(minX, CGFloat)
RCT_EXPORT_VIEW_PROPERTY(minY, CGFloat)
RCT_EXPORT_VIEW_PROPERTY(vbWidth, CGFloat)
RCT_EXPORT_VIEW_PROPERTY(vbHeight, CGFloat)
RCT_EXPORT_VIEW_PROPERTY(align, NSString)
RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, RNSVGVBMOS)

@end
