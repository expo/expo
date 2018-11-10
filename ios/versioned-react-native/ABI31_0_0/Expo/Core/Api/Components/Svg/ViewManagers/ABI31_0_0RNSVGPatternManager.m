/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI31_0_0RNSVGPatternManager.h"
#import "ABI31_0_0RNSVGPattern.h"

@implementation ABI31_0_0RNSVGPatternManager

ABI31_0_0RCT_EXPORT_MODULE()

- (ABI31_0_0RNSVGPattern *)node
{
    return [ABI31_0_0RNSVGPattern new];
}

ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(x, ABI31_0_0RNSVGLength*)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(y, ABI31_0_0RNSVGLength*)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(patternheight, ABI31_0_0RNSVGLength*)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(patternwidth, ABI31_0_0RNSVGLength*)
ABI31_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI31_0_0RNSVGPattern)
{
    view.patternheight = [ABI31_0_0RCTConvert ABI31_0_0RNSVGLength:json];
}

ABI31_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI31_0_0RNSVGPattern)
{
    view.patternwidth = [ABI31_0_0RCTConvert ABI31_0_0RNSVGLength:json];
}
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(patternUnits, ABI31_0_0RNSVGUnits)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(patternContentUnits, ABI31_0_0RNSVGUnits)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(patternTransform, CGAffineTransform)

ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(minX, CGFloat)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(minY, CGFloat)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(vbWidth, CGFloat)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(vbHeight, CGFloat)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI31_0_0RNSVGVBMOS)

@end
