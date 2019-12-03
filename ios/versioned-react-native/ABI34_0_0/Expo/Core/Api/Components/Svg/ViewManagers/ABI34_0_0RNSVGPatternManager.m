/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI34_0_0RNSVGPatternManager.h"
#import "ABI34_0_0RNSVGPattern.h"

@implementation ABI34_0_0RNSVGPatternManager

ABI34_0_0RCT_EXPORT_MODULE()

- (ABI34_0_0RNSVGPattern *)node
{
    return [ABI34_0_0RNSVGPattern new];
}

ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(x, ABI34_0_0RNSVGLength*)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(y, ABI34_0_0RNSVGLength*)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(patternheight, ABI34_0_0RNSVGLength*)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(patternwidth, ABI34_0_0RNSVGLength*)
ABI34_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI34_0_0RNSVGPattern)
{
    view.patternheight = [ABI34_0_0RCTConvert ABI34_0_0RNSVGLength:json];
}

ABI34_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI34_0_0RNSVGPattern)
{
    view.patternwidth = [ABI34_0_0RCTConvert ABI34_0_0RNSVGLength:json];
}
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(patternUnits, ABI34_0_0RNSVGUnits)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(patternContentUnits, ABI34_0_0RNSVGUnits)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(patternTransform, CGAffineTransform)

ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(minX, CGFloat)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(minY, CGFloat)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(vbWidth, CGFloat)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(vbHeight, CGFloat)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI34_0_0RNSVGVBMOS)

@end
