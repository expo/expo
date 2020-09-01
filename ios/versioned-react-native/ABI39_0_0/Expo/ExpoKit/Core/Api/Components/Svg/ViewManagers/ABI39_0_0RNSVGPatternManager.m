/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI39_0_0RNSVGPatternManager.h"
#import "ABI39_0_0RNSVGPattern.h"

@implementation ABI39_0_0RNSVGPatternManager

ABI39_0_0RCT_EXPORT_MODULE()

- (ABI39_0_0RNSVGPattern *)node
{
    return [ABI39_0_0RNSVGPattern new];
}

ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(x, ABI39_0_0RNSVGLength*)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(y, ABI39_0_0RNSVGLength*)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(patternheight, ABI39_0_0RNSVGLength*)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(patternwidth, ABI39_0_0RNSVGLength*)
ABI39_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI39_0_0RNSVGPattern)
{
    view.patternheight = [ABI39_0_0RCTConvert ABI39_0_0RNSVGLength:json];
}

ABI39_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI39_0_0RNSVGPattern)
{
    view.patternwidth = [ABI39_0_0RCTConvert ABI39_0_0RNSVGLength:json];
}
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(patternUnits, ABI39_0_0RNSVGUnits)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(patternContentUnits, ABI39_0_0RNSVGUnits)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(patternTransform, CGAffineTransform)

ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(minX, CGFloat)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(minY, CGFloat)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(vbWidth, CGFloat)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(vbHeight, CGFloat)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI39_0_0RNSVGVBMOS)

@end
