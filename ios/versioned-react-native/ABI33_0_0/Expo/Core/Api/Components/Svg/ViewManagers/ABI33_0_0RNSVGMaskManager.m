/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI33_0_0RNSVGMaskManager.h"
#import "ABI33_0_0RNSVGMask.h"

@implementation ABI33_0_0RNSVGMaskManager

ABI33_0_0RCT_EXPORT_MODULE()

- (ABI33_0_0RNSVGMask *)node
{
    return [ABI33_0_0RNSVGMask new];
}

ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(x, ABI33_0_0RNSVGLength*)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(y, ABI33_0_0RNSVGLength*)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(maskheight, ABI33_0_0RNSVGLength*)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(maskwidth, ABI33_0_0RNSVGLength*)
ABI33_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI33_0_0RNSVGMask)
{
    view.maskheight = [ABI33_0_0RCTConvert ABI33_0_0RNSVGLength:json];
}
ABI33_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI33_0_0RNSVGMask)
{
    view.maskwidth = [ABI33_0_0RCTConvert ABI33_0_0RNSVGLength:json];
}
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(maskUnits, ABI33_0_0RNSVGUnits)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(maskContentUnits, ABI33_0_0RNSVGUnits)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(maskTransform, CGAffineTransform)

@end
