/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI43_0_0RNSVGPatternManager.h"
#import "ABI43_0_0RNSVGPattern.h"

@implementation ABI43_0_0RNSVGPatternManager

ABI43_0_0RCT_EXPORT_MODULE()

- (ABI43_0_0RNSVGPattern *)node
{
    return [ABI43_0_0RNSVGPattern new];
}

ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(x, ABI43_0_0RNSVGLength*)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(y, ABI43_0_0RNSVGLength*)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(patternheight, ABI43_0_0RNSVGLength*)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(patternwidth, ABI43_0_0RNSVGLength*)
ABI43_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI43_0_0RNSVGPattern)
{
    view.patternheight = [ABI43_0_0RCTConvert ABI43_0_0RNSVGLength:json];
}

ABI43_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI43_0_0RNSVGPattern)
{
    view.patternwidth = [ABI43_0_0RCTConvert ABI43_0_0RNSVGLength:json];
}
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(patternUnits, ABI43_0_0RNSVGUnits)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(patternContentUnits, ABI43_0_0RNSVGUnits)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(patternTransform, CGAffineTransform)

ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(minX, CGFloat)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(minY, CGFloat)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(vbWidth, CGFloat)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(vbHeight, CGFloat)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI43_0_0RNSVGVBMOS)

@end
