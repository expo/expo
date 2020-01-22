/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI33_0_0RNSVGPatternManager.h"
#import "ABI33_0_0RNSVGPattern.h"

@implementation ABI33_0_0RNSVGPatternManager

ABI33_0_0RCT_EXPORT_MODULE()

- (ABI33_0_0RNSVGPattern *)node
{
    return [ABI33_0_0RNSVGPattern new];
}

ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(x, ABI33_0_0RNSVGLength*)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(y, ABI33_0_0RNSVGLength*)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(patternheight, ABI33_0_0RNSVGLength*)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(patternwidth, ABI33_0_0RNSVGLength*)
ABI33_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI33_0_0RNSVGPattern)
{
    view.patternheight = [ABI33_0_0RCTConvert ABI33_0_0RNSVGLength:json];
}

ABI33_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI33_0_0RNSVGPattern)
{
    view.patternwidth = [ABI33_0_0RCTConvert ABI33_0_0RNSVGLength:json];
}
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(patternUnits, ABI33_0_0RNSVGUnits)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(patternContentUnits, ABI33_0_0RNSVGUnits)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(patternTransform, CGAffineTransform)

ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(minX, CGFloat)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(minY, CGFloat)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(vbWidth, CGFloat)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(vbHeight, CGFloat)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI33_0_0RNSVGVBMOS)

@end
