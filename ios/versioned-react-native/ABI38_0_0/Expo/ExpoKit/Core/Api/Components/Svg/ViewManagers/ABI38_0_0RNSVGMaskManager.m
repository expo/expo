/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI38_0_0RNSVGMaskManager.h"
#import "ABI38_0_0RNSVGMask.h"

@implementation ABI38_0_0RNSVGMaskManager

ABI38_0_0RCT_EXPORT_MODULE()

- (ABI38_0_0RNSVGMask *)node
{
    return [ABI38_0_0RNSVGMask new];
}

ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(x, ABI38_0_0RNSVGLength*)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(y, ABI38_0_0RNSVGLength*)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(maskheight, ABI38_0_0RNSVGLength*)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(maskwidth, ABI38_0_0RNSVGLength*)
ABI38_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI38_0_0RNSVGMask)
{
    view.maskheight = [ABI38_0_0RCTConvert ABI38_0_0RNSVGLength:json];
}
ABI38_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI38_0_0RNSVGMask)
{
    view.maskwidth = [ABI38_0_0RCTConvert ABI38_0_0RNSVGLength:json];
}
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(maskUnits, ABI38_0_0RNSVGUnits)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(maskContentUnits, ABI38_0_0RNSVGUnits)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(maskTransform, CGAffineTransform)

@end
