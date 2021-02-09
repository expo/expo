/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI40_0_0RNSVGMaskManager.h"
#import "ABI40_0_0RNSVGMask.h"

@implementation ABI40_0_0RNSVGMaskManager

ABI40_0_0RCT_EXPORT_MODULE()

- (ABI40_0_0RNSVGMask *)node
{
    return [ABI40_0_0RNSVGMask new];
}

ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(x, ABI40_0_0RNSVGLength*)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(y, ABI40_0_0RNSVGLength*)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(maskheight, ABI40_0_0RNSVGLength*)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(maskwidth, ABI40_0_0RNSVGLength*)
ABI40_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI40_0_0RNSVGMask)
{
    view.maskheight = [ABI40_0_0RCTConvert ABI40_0_0RNSVGLength:json];
}
ABI40_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI40_0_0RNSVGMask)
{
    view.maskwidth = [ABI40_0_0RCTConvert ABI40_0_0RNSVGLength:json];
}
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(maskUnits, ABI40_0_0RNSVGUnits)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(maskContentUnits, ABI40_0_0RNSVGUnits)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(maskTransform, CGAffineTransform)

@end
