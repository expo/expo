/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI47_0_0RNSVGMaskManager.h"
#import "ABI47_0_0RNSVGMask.h"

@implementation ABI47_0_0RNSVGMaskManager

ABI47_0_0RCT_EXPORT_MODULE()

- (ABI47_0_0RNSVGMask *)node
{
  return [ABI47_0_0RNSVGMask new];
}

ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(x, ABI47_0_0RNSVGLength *)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(y, ABI47_0_0RNSVGLength *)
ABI47_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI47_0_0RNSVGMask)
{
  view.maskheight = [ABI47_0_0RCTConvert ABI47_0_0RNSVGLength:json];
}
ABI47_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI47_0_0RNSVGMask)
{
  view.maskwidth = [ABI47_0_0RCTConvert ABI47_0_0RNSVGLength:json];
}
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(maskUnits, ABI47_0_0RNSVGUnits)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(maskContentUnits, ABI47_0_0RNSVGUnits)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(maskTransform, CGAffineTransform)

@end
