/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI32_0_0RNSVGMaskManager.h"
#import "ABI32_0_0RNSVGMask.h"

@implementation ABI32_0_0RNSVGMaskManager

ABI32_0_0RCT_EXPORT_MODULE()

- (ABI32_0_0RNSVGMask *)node
{
    return [ABI32_0_0RNSVGMask new];
}

ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(x, ABI32_0_0RNSVGLength*)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(y, ABI32_0_0RNSVGLength*)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(maskheight, ABI32_0_0RNSVGLength*)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(maskwidth, ABI32_0_0RNSVGLength*)
ABI32_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI32_0_0RNSVGMask)
{
    view.maskheight = [ABI32_0_0RCTConvert ABI32_0_0RNSVGLength:json];
}
ABI32_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI32_0_0RNSVGMask)
{
    view.maskwidth = [ABI32_0_0RCTConvert ABI32_0_0RNSVGLength:json];
}
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(maskUnits, ABI32_0_0RNSVGUnits)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(maskContentUnits, ABI32_0_0RNSVGUnits)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(maskTransform, CGAffineTransform)

@end
