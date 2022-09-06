/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI46_0_0RNSVGPatternManager.h"
#import "ABI46_0_0RNSVGPattern.h"

@implementation ABI46_0_0RNSVGPatternManager

ABI46_0_0RCT_EXPORT_MODULE()

- (ABI46_0_0RNSVGPattern *)node
{
    return [ABI46_0_0RNSVGPattern new];
}

ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(x, ABI46_0_0RNSVGLength*)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(y, ABI46_0_0RNSVGLength*)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(patternheight, ABI46_0_0RNSVGLength*)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(patternwidth, ABI46_0_0RNSVGLength*)
ABI46_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI46_0_0RNSVGPattern)
{
    view.patternheight = [ABI46_0_0RCTConvert ABI46_0_0RNSVGLength:json];
}

ABI46_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI46_0_0RNSVGPattern)
{
    view.patternwidth = [ABI46_0_0RCTConvert ABI46_0_0RNSVGLength:json];
}
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(patternUnits, ABI46_0_0RNSVGUnits)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(patternContentUnits, ABI46_0_0RNSVGUnits)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(patternTransform, CGAffineTransform)

ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(minX, CGFloat)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(minY, CGFloat)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(vbWidth, CGFloat)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(vbHeight, CGFloat)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI46_0_0RNSVGVBMOS)

@end
