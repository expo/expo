/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI43_0_0RNSVGMaskManager.h"
#import "ABI43_0_0RNSVGMask.h"

@implementation ABI43_0_0RNSVGMaskManager

ABI43_0_0RCT_EXPORT_MODULE()

- (ABI43_0_0RNSVGMask *)node
{
    return [ABI43_0_0RNSVGMask new];
}

ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(x, ABI43_0_0RNSVGLength*)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(y, ABI43_0_0RNSVGLength*)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(maskheight, ABI43_0_0RNSVGLength*)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(maskwidth, ABI43_0_0RNSVGLength*)
ABI43_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI43_0_0RNSVGMask)
{
    view.maskheight = [ABI43_0_0RCTConvert ABI43_0_0RNSVGLength:json];
}
ABI43_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI43_0_0RNSVGMask)
{
    view.maskwidth = [ABI43_0_0RCTConvert ABI43_0_0RNSVGLength:json];
}
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(maskUnits, ABI43_0_0RNSVGUnits)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(maskContentUnits, ABI43_0_0RNSVGUnits)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(maskTransform, CGAffineTransform)

@end
