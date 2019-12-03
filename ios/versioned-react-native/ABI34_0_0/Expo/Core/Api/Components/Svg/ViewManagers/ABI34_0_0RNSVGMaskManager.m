/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI34_0_0RNSVGMaskManager.h"
#import "ABI34_0_0RNSVGMask.h"

@implementation ABI34_0_0RNSVGMaskManager

ABI34_0_0RCT_EXPORT_MODULE()

- (ABI34_0_0RNSVGMask *)node
{
    return [ABI34_0_0RNSVGMask new];
}

ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(x, ABI34_0_0RNSVGLength*)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(y, ABI34_0_0RNSVGLength*)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(maskheight, ABI34_0_0RNSVGLength*)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(maskwidth, ABI34_0_0RNSVGLength*)
ABI34_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI34_0_0RNSVGMask)
{
    view.maskheight = [ABI34_0_0RCTConvert ABI34_0_0RNSVGLength:json];
}
ABI34_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI34_0_0RNSVGMask)
{
    view.maskwidth = [ABI34_0_0RCTConvert ABI34_0_0RNSVGLength:json];
}
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(maskUnits, ABI34_0_0RNSVGUnits)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(maskContentUnits, ABI34_0_0RNSVGUnits)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(maskTransform, CGAffineTransform)

@end
