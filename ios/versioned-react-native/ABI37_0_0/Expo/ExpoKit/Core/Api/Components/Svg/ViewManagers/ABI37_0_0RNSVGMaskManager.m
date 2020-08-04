/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI37_0_0RNSVGMaskManager.h"
#import "ABI37_0_0RNSVGMask.h"

@implementation ABI37_0_0RNSVGMaskManager

ABI37_0_0RCT_EXPORT_MODULE()

- (ABI37_0_0RNSVGMask *)node
{
    return [ABI37_0_0RNSVGMask new];
}

ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(x, ABI37_0_0RNSVGLength*)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(y, ABI37_0_0RNSVGLength*)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(maskheight, ABI37_0_0RNSVGLength*)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(maskwidth, ABI37_0_0RNSVGLength*)
ABI37_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI37_0_0RNSVGMask)
{
    view.maskheight = [ABI37_0_0RCTConvert ABI37_0_0RNSVGLength:json];
}
ABI37_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI37_0_0RNSVGMask)
{
    view.maskwidth = [ABI37_0_0RCTConvert ABI37_0_0RNSVGLength:json];
}
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(maskUnits, ABI37_0_0RNSVGUnits)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(maskContentUnits, ABI37_0_0RNSVGUnits)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(maskTransform, CGAffineTransform)

@end
