/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI48_0_0RNSVGPatternManager.h"
#import "ABI48_0_0RNSVGPattern.h"

@implementation ABI48_0_0RNSVGPatternManager

ABI48_0_0RCT_EXPORT_MODULE()

- (ABI48_0_0RNSVGPattern *)node
{
  return [ABI48_0_0RNSVGPattern new];
}

ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(x, ABI48_0_0RNSVGLength *)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(y, ABI48_0_0RNSVGLength *)
ABI48_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI48_0_0RNSVGPattern)
{
  view.patternheight = [ABI48_0_0RCTConvert ABI48_0_0RNSVGLength:json];
}

ABI48_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI48_0_0RNSVGPattern)
{
  view.patternwidth = [ABI48_0_0RCTConvert ABI48_0_0RNSVGLength:json];
}
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(patternUnits, ABI48_0_0RNSVGUnits)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(patternContentUnits, ABI48_0_0RNSVGUnits)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(patternTransform, CGAffineTransform)

ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(minX, CGFloat)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(minY, CGFloat)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(vbWidth, CGFloat)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(vbHeight, CGFloat)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI48_0_0RNSVGVBMOS)

@end
