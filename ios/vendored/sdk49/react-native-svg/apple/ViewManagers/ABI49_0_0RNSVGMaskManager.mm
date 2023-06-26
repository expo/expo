/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI49_0_0RNSVGMaskManager.h"
#import "ABI49_0_0RNSVGMask.h"

@implementation ABI49_0_0RNSVGMaskManager

ABI49_0_0RCT_EXPORT_MODULE()

- (ABI49_0_0RNSVGMask *)node
{
  return [ABI49_0_0RNSVGMask new];
}

ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(x, ABI49_0_0RNSVGLength *)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(y, ABI49_0_0RNSVGLength *)
ABI49_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI49_0_0RNSVGMask)
{
  view.maskheight = [ABI49_0_0RCTConvert ABI49_0_0RNSVGLength:json];
}
ABI49_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI49_0_0RNSVGMask)
{
  view.maskwidth = [ABI49_0_0RCTConvert ABI49_0_0RNSVGLength:json];
}
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(maskUnits, ABI49_0_0RNSVGUnits)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(maskContentUnits, ABI49_0_0RNSVGUnits)

@end
