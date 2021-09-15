/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI42_0_0RNSVGMaskManager.h"
#import "ABI42_0_0RNSVGMask.h"

@implementation ABI42_0_0RNSVGMaskManager

ABI42_0_0RCT_EXPORT_MODULE()

- (ABI42_0_0RNSVGMask *)node
{
    return [ABI42_0_0RNSVGMask new];
}

ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(x, ABI42_0_0RNSVGLength*)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(y, ABI42_0_0RNSVGLength*)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(maskheight, ABI42_0_0RNSVGLength*)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(maskwidth, ABI42_0_0RNSVGLength*)
ABI42_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI42_0_0RNSVGMask)
{
    view.maskheight = [ABI42_0_0RCTConvert ABI42_0_0RNSVGLength:json];
}
ABI42_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI42_0_0RNSVGMask)
{
    view.maskwidth = [ABI42_0_0RCTConvert ABI42_0_0RNSVGLength:json];
}
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(maskUnits, ABI42_0_0RNSVGUnits)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(maskContentUnits, ABI42_0_0RNSVGUnits)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(maskTransform, CGAffineTransform)

@end
