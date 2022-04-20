/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI45_0_0RNSVGPatternManager.h"
#import "ABI45_0_0RNSVGPattern.h"

@implementation ABI45_0_0RNSVGPatternManager

ABI45_0_0RCT_EXPORT_MODULE()

- (ABI45_0_0RNSVGPattern *)node
{
    return [ABI45_0_0RNSVGPattern new];
}

ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(x, ABI45_0_0RNSVGLength*)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(y, ABI45_0_0RNSVGLength*)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(patternheight, ABI45_0_0RNSVGLength*)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(patternwidth, ABI45_0_0RNSVGLength*)
ABI45_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI45_0_0RNSVGPattern)
{
    view.patternheight = [ABI45_0_0RCTConvert ABI45_0_0RNSVGLength:json];
}

ABI45_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI45_0_0RNSVGPattern)
{
    view.patternwidth = [ABI45_0_0RCTConvert ABI45_0_0RNSVGLength:json];
}
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(patternUnits, ABI45_0_0RNSVGUnits)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(patternContentUnits, ABI45_0_0RNSVGUnits)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(patternTransform, CGAffineTransform)

ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(minX, CGFloat)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(minY, CGFloat)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(vbWidth, CGFloat)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(vbHeight, CGFloat)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI45_0_0RNSVGVBMOS)

@end
