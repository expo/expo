/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI36_0_0RNSVGPatternManager.h"
#import "ABI36_0_0RNSVGPattern.h"

@implementation ABI36_0_0RNSVGPatternManager

ABI36_0_0RCT_EXPORT_MODULE()

- (ABI36_0_0RNSVGPattern *)node
{
    return [ABI36_0_0RNSVGPattern new];
}

ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(x, ABI36_0_0RNSVGLength*)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(y, ABI36_0_0RNSVGLength*)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(patternheight, ABI36_0_0RNSVGLength*)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(patternwidth, ABI36_0_0RNSVGLength*)
ABI36_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI36_0_0RNSVGPattern)
{
    view.patternheight = [ABI36_0_0RCTConvert ABI36_0_0RNSVGLength:json];
}

ABI36_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI36_0_0RNSVGPattern)
{
    view.patternwidth = [ABI36_0_0RCTConvert ABI36_0_0RNSVGLength:json];
}
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(patternUnits, ABI36_0_0RNSVGUnits)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(patternContentUnits, ABI36_0_0RNSVGUnits)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(patternTransform, CGAffineTransform)

ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(minX, CGFloat)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(minY, CGFloat)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(vbWidth, CGFloat)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(vbHeight, CGFloat)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI36_0_0RNSVGVBMOS)

@end
