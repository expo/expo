/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI40_0_0RNSVGPatternManager.h"
#import "ABI40_0_0RNSVGPattern.h"

@implementation ABI40_0_0RNSVGPatternManager

ABI40_0_0RCT_EXPORT_MODULE()

- (ABI40_0_0RNSVGPattern *)node
{
    return [ABI40_0_0RNSVGPattern new];
}

ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(x, ABI40_0_0RNSVGLength*)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(y, ABI40_0_0RNSVGLength*)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(patternheight, ABI40_0_0RNSVGLength*)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(patternwidth, ABI40_0_0RNSVGLength*)
ABI40_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI40_0_0RNSVGPattern)
{
    view.patternheight = [ABI40_0_0RCTConvert ABI40_0_0RNSVGLength:json];
}

ABI40_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI40_0_0RNSVGPattern)
{
    view.patternwidth = [ABI40_0_0RCTConvert ABI40_0_0RNSVGLength:json];
}
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(patternUnits, ABI40_0_0RNSVGUnits)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(patternContentUnits, ABI40_0_0RNSVGUnits)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(patternTransform, CGAffineTransform)

ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(minX, CGFloat)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(minY, CGFloat)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(vbWidth, CGFloat)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(vbHeight, CGFloat)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI40_0_0RNSVGVBMOS)

@end
