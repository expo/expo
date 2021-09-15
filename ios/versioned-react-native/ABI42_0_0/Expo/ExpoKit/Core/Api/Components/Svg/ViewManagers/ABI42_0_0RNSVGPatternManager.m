/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI42_0_0RNSVGPatternManager.h"
#import "ABI42_0_0RNSVGPattern.h"

@implementation ABI42_0_0RNSVGPatternManager

ABI42_0_0RCT_EXPORT_MODULE()

- (ABI42_0_0RNSVGPattern *)node
{
    return [ABI42_0_0RNSVGPattern new];
}

ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(x, ABI42_0_0RNSVGLength*)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(y, ABI42_0_0RNSVGLength*)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(patternheight, ABI42_0_0RNSVGLength*)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(patternwidth, ABI42_0_0RNSVGLength*)
ABI42_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI42_0_0RNSVGPattern)
{
    view.patternheight = [ABI42_0_0RCTConvert ABI42_0_0RNSVGLength:json];
}

ABI42_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI42_0_0RNSVGPattern)
{
    view.patternwidth = [ABI42_0_0RCTConvert ABI42_0_0RNSVGLength:json];
}
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(patternUnits, ABI42_0_0RNSVGUnits)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(patternContentUnits, ABI42_0_0RNSVGUnits)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(patternTransform, CGAffineTransform)

ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(minX, CGFloat)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(minY, CGFloat)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(vbWidth, CGFloat)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(vbHeight, CGFloat)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI42_0_0RNSVGVBMOS)

@end
