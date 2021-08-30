/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI41_0_0RNSVGPatternManager.h"
#import "ABI41_0_0RNSVGPattern.h"

@implementation ABI41_0_0RNSVGPatternManager

ABI41_0_0RCT_EXPORT_MODULE()

- (ABI41_0_0RNSVGPattern *)node
{
    return [ABI41_0_0RNSVGPattern new];
}

ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(x, ABI41_0_0RNSVGLength*)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(y, ABI41_0_0RNSVGLength*)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(patternheight, ABI41_0_0RNSVGLength*)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(patternwidth, ABI41_0_0RNSVGLength*)
ABI41_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI41_0_0RNSVGPattern)
{
    view.patternheight = [ABI41_0_0RCTConvert ABI41_0_0RNSVGLength:json];
}

ABI41_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI41_0_0RNSVGPattern)
{
    view.patternwidth = [ABI41_0_0RCTConvert ABI41_0_0RNSVGLength:json];
}
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(patternUnits, ABI41_0_0RNSVGUnits)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(patternContentUnits, ABI41_0_0RNSVGUnits)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(patternTransform, CGAffineTransform)

ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(minX, CGFloat)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(minY, CGFloat)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(vbWidth, CGFloat)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(vbHeight, CGFloat)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI41_0_0RNSVGVBMOS)

@end
