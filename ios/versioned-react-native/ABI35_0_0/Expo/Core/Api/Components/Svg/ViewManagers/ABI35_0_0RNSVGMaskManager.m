/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI35_0_0RNSVGMaskManager.h"
#import "ABI35_0_0RNSVGMask.h"

@implementation ABI35_0_0RNSVGMaskManager

ABI35_0_0RCT_EXPORT_MODULE()

- (ABI35_0_0RNSVGMask *)node
{
    return [ABI35_0_0RNSVGMask new];
}

ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(x, ABI35_0_0RNSVGLength*)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(y, ABI35_0_0RNSVGLength*)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(maskheight, ABI35_0_0RNSVGLength*)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(maskwidth, ABI35_0_0RNSVGLength*)
ABI35_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI35_0_0RNSVGMask)
{
    view.maskheight = [ABI35_0_0RCTConvert ABI35_0_0RNSVGLength:json];
}
ABI35_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI35_0_0RNSVGMask)
{
    view.maskwidth = [ABI35_0_0RCTConvert ABI35_0_0RNSVGLength:json];
}
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(maskUnits, ABI35_0_0RNSVGUnits)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(maskContentUnits, ABI35_0_0RNSVGUnits)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(maskTransform, CGAffineTransform)

@end
