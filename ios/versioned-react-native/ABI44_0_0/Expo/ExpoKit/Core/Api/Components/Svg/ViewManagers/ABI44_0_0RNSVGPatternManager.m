/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI44_0_0RNSVGPatternManager.h"
#import "ABI44_0_0RNSVGPattern.h"

@implementation ABI44_0_0RNSVGPatternManager

ABI44_0_0RCT_EXPORT_MODULE()

- (ABI44_0_0RNSVGPattern *)node
{
    return [ABI44_0_0RNSVGPattern new];
}

ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(x, ABI44_0_0RNSVGLength*)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(y, ABI44_0_0RNSVGLength*)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(patternheight, ABI44_0_0RNSVGLength*)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(patternwidth, ABI44_0_0RNSVGLength*)
ABI44_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI44_0_0RNSVGPattern)
{
    view.patternheight = [ABI44_0_0RCTConvert ABI44_0_0RNSVGLength:json];
}

ABI44_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI44_0_0RNSVGPattern)
{
    view.patternwidth = [ABI44_0_0RCTConvert ABI44_0_0RNSVGLength:json];
}
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(patternUnits, ABI44_0_0RNSVGUnits)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(patternContentUnits, ABI44_0_0RNSVGUnits)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(patternTransform, CGAffineTransform)

ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(minX, CGFloat)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(minY, CGFloat)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(vbWidth, CGFloat)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(vbHeight, CGFloat)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI44_0_0RNSVGVBMOS)

@end
