/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI49_0_0RNSVGPatternManager.h"
#import "ABI49_0_0RNSVGPattern.h"

@implementation ABI49_0_0RNSVGPatternManager

ABI49_0_0RCT_EXPORT_MODULE()

- (ABI49_0_0RNSVGPattern *)node
{
  return [ABI49_0_0RNSVGPattern new];
}

ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(x, ABI49_0_0RNSVGLength *)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(y, ABI49_0_0RNSVGLength *)
ABI49_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI49_0_0RNSVGPattern)
{
  view.patternheight = [ABI49_0_0RCTConvert ABI49_0_0RNSVGLength:json];
}

ABI49_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI49_0_0RNSVGPattern)
{
  view.patternwidth = [ABI49_0_0RCTConvert ABI49_0_0RNSVGLength:json];
}
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(patternUnits, ABI49_0_0RNSVGUnits)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(patternContentUnits, ABI49_0_0RNSVGUnits)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(patternTransform, CGAffineTransform)

ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(minX, CGFloat)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(minY, CGFloat)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(vbWidth, CGFloat)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(vbHeight, CGFloat)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI49_0_0RNSVGVBMOS)

@end
