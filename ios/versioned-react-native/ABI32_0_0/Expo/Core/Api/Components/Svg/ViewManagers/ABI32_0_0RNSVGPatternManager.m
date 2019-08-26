/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI32_0_0RNSVGPatternManager.h"
#import "ABI32_0_0RNSVGPattern.h"

@implementation ABI32_0_0RNSVGPatternManager

ABI32_0_0RCT_EXPORT_MODULE()

- (ABI32_0_0RNSVGPattern *)node
{
    return [ABI32_0_0RNSVGPattern new];
}

ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(x, ABI32_0_0RNSVGLength*)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(y, ABI32_0_0RNSVGLength*)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(patternheight, ABI32_0_0RNSVGLength*)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(patternwidth, ABI32_0_0RNSVGLength*)
ABI32_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI32_0_0RNSVGPattern)
{
    view.patternheight = [ABI32_0_0RCTConvert ABI32_0_0RNSVGLength:json];
}

ABI32_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI32_0_0RNSVGPattern)
{
    view.patternwidth = [ABI32_0_0RCTConvert ABI32_0_0RNSVGLength:json];
}
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(patternUnits, ABI32_0_0RNSVGUnits)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(patternContentUnits, ABI32_0_0RNSVGUnits)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(patternTransform, CGAffineTransform)

ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(minX, CGFloat)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(minY, CGFloat)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(vbWidth, CGFloat)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(vbHeight, CGFloat)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI32_0_0RNSVGVBMOS)

@end
