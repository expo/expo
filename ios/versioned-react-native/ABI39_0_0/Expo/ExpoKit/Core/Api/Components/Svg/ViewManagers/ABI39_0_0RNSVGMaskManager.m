/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI39_0_0RNSVGMaskManager.h"
#import "ABI39_0_0RNSVGMask.h"

@implementation ABI39_0_0RNSVGMaskManager

ABI39_0_0RCT_EXPORT_MODULE()

- (ABI39_0_0RNSVGMask *)node
{
    return [ABI39_0_0RNSVGMask new];
}

ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(x, ABI39_0_0RNSVGLength*)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(y, ABI39_0_0RNSVGLength*)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(maskheight, ABI39_0_0RNSVGLength*)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(maskwidth, ABI39_0_0RNSVGLength*)
ABI39_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI39_0_0RNSVGMask)
{
    view.maskheight = [ABI39_0_0RCTConvert ABI39_0_0RNSVGLength:json];
}
ABI39_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI39_0_0RNSVGMask)
{
    view.maskwidth = [ABI39_0_0RCTConvert ABI39_0_0RNSVGLength:json];
}
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(maskUnits, ABI39_0_0RNSVGUnits)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(maskContentUnits, ABI39_0_0RNSVGUnits)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(maskTransform, CGAffineTransform)

@end
