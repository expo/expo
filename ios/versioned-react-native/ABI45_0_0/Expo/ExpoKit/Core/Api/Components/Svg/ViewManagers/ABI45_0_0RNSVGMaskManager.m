/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI45_0_0RNSVGMaskManager.h"
#import "ABI45_0_0RNSVGMask.h"

@implementation ABI45_0_0RNSVGMaskManager

ABI45_0_0RCT_EXPORT_MODULE()

- (ABI45_0_0RNSVGMask *)node
{
    return [ABI45_0_0RNSVGMask new];
}

ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(x, ABI45_0_0RNSVGLength*)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(y, ABI45_0_0RNSVGLength*)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(maskheight, ABI45_0_0RNSVGLength*)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(maskwidth, ABI45_0_0RNSVGLength*)
ABI45_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI45_0_0RNSVGMask)
{
    view.maskheight = [ABI45_0_0RCTConvert ABI45_0_0RNSVGLength:json];
}
ABI45_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI45_0_0RNSVGMask)
{
    view.maskwidth = [ABI45_0_0RCTConvert ABI45_0_0RNSVGLength:json];
}
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(maskUnits, ABI45_0_0RNSVGUnits)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(maskContentUnits, ABI45_0_0RNSVGUnits)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(maskTransform, CGAffineTransform)

@end
