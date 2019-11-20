/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI35_0_0RNSVGPatternManager.h"
#import "ABI35_0_0RNSVGPattern.h"

@implementation ABI35_0_0RNSVGPatternManager

ABI35_0_0RCT_EXPORT_MODULE()

- (ABI35_0_0RNSVGPattern *)node
{
    return [ABI35_0_0RNSVGPattern new];
}

ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(x, ABI35_0_0RNSVGLength*)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(y, ABI35_0_0RNSVGLength*)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(patternheight, ABI35_0_0RNSVGLength*)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(patternwidth, ABI35_0_0RNSVGLength*)
ABI35_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI35_0_0RNSVGPattern)
{
    view.patternheight = [ABI35_0_0RCTConvert ABI35_0_0RNSVGLength:json];
}

ABI35_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI35_0_0RNSVGPattern)
{
    view.patternwidth = [ABI35_0_0RCTConvert ABI35_0_0RNSVGLength:json];
}
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(patternUnits, ABI35_0_0RNSVGUnits)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(patternContentUnits, ABI35_0_0RNSVGUnits)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(patternTransform, CGAffineTransform)

ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(minX, CGFloat)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(minY, CGFloat)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(vbWidth, CGFloat)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(vbHeight, CGFloat)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI35_0_0RNSVGVBMOS)

@end
