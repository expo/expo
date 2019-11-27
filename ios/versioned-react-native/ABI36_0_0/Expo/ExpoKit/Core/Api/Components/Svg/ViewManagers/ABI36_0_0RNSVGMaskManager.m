/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI36_0_0RNSVGMaskManager.h"
#import "ABI36_0_0RNSVGMask.h"

@implementation ABI36_0_0RNSVGMaskManager

ABI36_0_0RCT_EXPORT_MODULE()

- (ABI36_0_0RNSVGMask *)node
{
    return [ABI36_0_0RNSVGMask new];
}

ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(x, ABI36_0_0RNSVGLength*)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(y, ABI36_0_0RNSVGLength*)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(maskheight, ABI36_0_0RNSVGLength*)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(maskwidth, ABI36_0_0RNSVGLength*)
ABI36_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI36_0_0RNSVGMask)
{
    view.maskheight = [ABI36_0_0RCTConvert ABI36_0_0RNSVGLength:json];
}
ABI36_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI36_0_0RNSVGMask)
{
    view.maskwidth = [ABI36_0_0RCTConvert ABI36_0_0RNSVGLength:json];
}
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(maskUnits, ABI36_0_0RNSVGUnits)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(maskContentUnits, ABI36_0_0RNSVGUnits)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(maskTransform, CGAffineTransform)

@end
