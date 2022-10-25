/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI47_0_0RNSVGPatternManager.h"
#import "ABI47_0_0RNSVGPattern.h"

@implementation ABI47_0_0RNSVGPatternManager

ABI47_0_0RCT_EXPORT_MODULE()

- (ABI47_0_0RNSVGPattern *)node
{
  return [ABI47_0_0RNSVGPattern new];
}

ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(x, ABI47_0_0RNSVGLength *)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(y, ABI47_0_0RNSVGLength *)
ABI47_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI47_0_0RNSVGPattern)
{
  view.patternheight = [ABI47_0_0RCTConvert ABI47_0_0RNSVGLength:json];
}

ABI47_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI47_0_0RNSVGPattern)
{
  view.patternwidth = [ABI47_0_0RCTConvert ABI47_0_0RNSVGLength:json];
}
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(patternUnits, ABI47_0_0RNSVGUnits)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(patternContentUnits, ABI47_0_0RNSVGUnits)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(patternTransform, CGAffineTransform)

ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(minX, CGFloat)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(minY, CGFloat)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(vbWidth, CGFloat)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(vbHeight, CGFloat)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI47_0_0RNSVGVBMOS)

@end
