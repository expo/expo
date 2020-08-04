/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI38_0_0RNSVGPatternManager.h"
#import "ABI38_0_0RNSVGPattern.h"

@implementation ABI38_0_0RNSVGPatternManager

ABI38_0_0RCT_EXPORT_MODULE()

- (ABI38_0_0RNSVGPattern *)node
{
    return [ABI38_0_0RNSVGPattern new];
}

ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(x, ABI38_0_0RNSVGLength*)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(y, ABI38_0_0RNSVGLength*)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(patternheight, ABI38_0_0RNSVGLength*)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(patternwidth, ABI38_0_0RNSVGLength*)
ABI38_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI38_0_0RNSVGPattern)
{
    view.patternheight = [ABI38_0_0RCTConvert ABI38_0_0RNSVGLength:json];
}

ABI38_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI38_0_0RNSVGPattern)
{
    view.patternwidth = [ABI38_0_0RCTConvert ABI38_0_0RNSVGLength:json];
}
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(patternUnits, ABI38_0_0RNSVGUnits)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(patternContentUnits, ABI38_0_0RNSVGUnits)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(patternTransform, CGAffineTransform)

ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(minX, CGFloat)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(minY, CGFloat)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(vbWidth, CGFloat)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(vbHeight, CGFloat)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI38_0_0RNSVGVBMOS)

@end
