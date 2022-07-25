/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI46_0_0RNSVGMaskManager.h"
#import "ABI46_0_0RNSVGMask.h"

@implementation ABI46_0_0RNSVGMaskManager

ABI46_0_0RCT_EXPORT_MODULE()

- (ABI46_0_0RNSVGMask *)node
{
    return [ABI46_0_0RNSVGMask new];
}

ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(x, ABI46_0_0RNSVGLength*)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(y, ABI46_0_0RNSVGLength*)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(maskheight, ABI46_0_0RNSVGLength*)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(maskwidth, ABI46_0_0RNSVGLength*)
ABI46_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI46_0_0RNSVGMask)
{
    view.maskheight = [ABI46_0_0RCTConvert ABI46_0_0RNSVGLength:json];
}
ABI46_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI46_0_0RNSVGMask)
{
    view.maskwidth = [ABI46_0_0RCTConvert ABI46_0_0RNSVGLength:json];
}
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(maskUnits, ABI46_0_0RNSVGUnits)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(maskContentUnits, ABI46_0_0RNSVGUnits)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(maskTransform, CGAffineTransform)

@end
