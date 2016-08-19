/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RNSVGViewBoxManager.h"
#import "RNSVGViewBox.h"
#import "RNSVGVBMOS.h"

@implementation RNSVGViewBoxManager

RCT_EXPORT_MODULE()

- (RNSVGViewBox *)node
{
  return [RNSVGViewBox new];
}

RCT_EXPORT_VIEW_PROPERTY(minX, NSString)
RCT_EXPORT_VIEW_PROPERTY(minY, NSString)
RCT_EXPORT_VIEW_PROPERTY(vbWidth, NSString)
RCT_EXPORT_VIEW_PROPERTY(vbHeight, NSString)
RCT_EXPORT_VIEW_PROPERTY(align, NSString)
RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, RNSVGVBMOS)

@end
