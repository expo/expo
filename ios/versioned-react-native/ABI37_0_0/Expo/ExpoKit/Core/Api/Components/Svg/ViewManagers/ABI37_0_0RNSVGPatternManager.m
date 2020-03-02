/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI37_0_0RNSVGPatternManager.h"
#import "ABI37_0_0RNSVGPattern.h"

@implementation ABI37_0_0RNSVGPatternManager

ABI37_0_0RCT_EXPORT_MODULE()

- (ABI37_0_0RNSVGPattern *)node
{
    return [ABI37_0_0RNSVGPattern new];
}

ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(x, ABI37_0_0RNSVGLength*)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(y, ABI37_0_0RNSVGLength*)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(patternheight, ABI37_0_0RNSVGLength*)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(patternwidth, ABI37_0_0RNSVGLength*)
ABI37_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI37_0_0RNSVGPattern)
{
    view.patternheight = [ABI37_0_0RCTConvert ABI37_0_0RNSVGLength:json];
}

ABI37_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI37_0_0RNSVGPattern)
{
    view.patternwidth = [ABI37_0_0RCTConvert ABI37_0_0RNSVGLength:json];
}
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(patternUnits, ABI37_0_0RNSVGUnits)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(patternContentUnits, ABI37_0_0RNSVGUnits)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(patternTransform, CGAffineTransform)

ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(minX, CGFloat)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(minY, CGFloat)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(vbWidth, CGFloat)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(vbHeight, CGFloat)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI37_0_0RNSVGVBMOS)

@end
