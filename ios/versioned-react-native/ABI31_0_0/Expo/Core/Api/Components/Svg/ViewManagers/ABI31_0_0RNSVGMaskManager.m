/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI31_0_0RNSVGMaskManager.h"
#import "ABI31_0_0RNSVGMask.h"

@implementation ABI31_0_0RNSVGMaskManager

ABI31_0_0RCT_EXPORT_MODULE()

- (ABI31_0_0RNSVGMask *)node
{
    return [ABI31_0_0RNSVGMask new];
}

ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(x, ABI31_0_0RNSVGLength*)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(y, ABI31_0_0RNSVGLength*)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(maskheight, ABI31_0_0RNSVGLength*)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(maskwidth, ABI31_0_0RNSVGLength*)
ABI31_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI31_0_0RNSVGMask)
{
    view.maskheight = [ABI31_0_0RCTConvert ABI31_0_0RNSVGLength:json];
}
ABI31_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI31_0_0RNSVGMask)
{
    view.maskwidth = [ABI31_0_0RCTConvert ABI31_0_0RNSVGLength:json];
}
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(maskUnits, ABI31_0_0RNSVGUnits)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(maskContentUnits, ABI31_0_0RNSVGUnits)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(maskTransform, CGAffineTransform)

@end
