/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI44_0_0RNSVGMaskManager.h"
#import "ABI44_0_0RNSVGMask.h"

@implementation ABI44_0_0RNSVGMaskManager

ABI44_0_0RCT_EXPORT_MODULE()

- (ABI44_0_0RNSVGMask *)node
{
    return [ABI44_0_0RNSVGMask new];
}

ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(x, ABI44_0_0RNSVGLength*)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(y, ABI44_0_0RNSVGLength*)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(maskheight, ABI44_0_0RNSVGLength*)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(maskwidth, ABI44_0_0RNSVGLength*)
ABI44_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI44_0_0RNSVGMask)
{
    view.maskheight = [ABI44_0_0RCTConvert ABI44_0_0RNSVGLength:json];
}
ABI44_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI44_0_0RNSVGMask)
{
    view.maskwidth = [ABI44_0_0RCTConvert ABI44_0_0RNSVGLength:json];
}
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(maskUnits, ABI44_0_0RNSVGUnits)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(maskContentUnits, ABI44_0_0RNSVGUnits)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(maskTransform, CGAffineTransform)

@end
