/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI41_0_0RNSVGMaskManager.h"
#import "ABI41_0_0RNSVGMask.h"

@implementation ABI41_0_0RNSVGMaskManager

ABI41_0_0RCT_EXPORT_MODULE()

- (ABI41_0_0RNSVGMask *)node
{
    return [ABI41_0_0RNSVGMask new];
}

ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(x, ABI41_0_0RNSVGLength*)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(y, ABI41_0_0RNSVGLength*)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(maskheight, ABI41_0_0RNSVGLength*)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(maskwidth, ABI41_0_0RNSVGLength*)
ABI41_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI41_0_0RNSVGMask)
{
    view.maskheight = [ABI41_0_0RCTConvert ABI41_0_0RNSVGLength:json];
}
ABI41_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI41_0_0RNSVGMask)
{
    view.maskwidth = [ABI41_0_0RCTConvert ABI41_0_0RNSVGLength:json];
}
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(maskUnits, ABI41_0_0RNSVGUnits)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(maskContentUnits, ABI41_0_0RNSVGUnits)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(maskTransform, CGAffineTransform)

@end
