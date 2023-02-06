/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI48_0_0RNSVGMaskManager.h"
#import "ABI48_0_0RNSVGMask.h"

@implementation ABI48_0_0RNSVGMaskManager

ABI48_0_0RCT_EXPORT_MODULE()

- (ABI48_0_0RNSVGMask *)node
{
  return [ABI48_0_0RNSVGMask new];
}

ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(x, ABI48_0_0RNSVGLength *)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(y, ABI48_0_0RNSVGLength *)
ABI48_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI48_0_0RNSVGMask)
{
  view.maskheight = [ABI48_0_0RCTConvert ABI48_0_0RNSVGLength:json];
}
ABI48_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI48_0_0RNSVGMask)
{
  view.maskwidth = [ABI48_0_0RCTConvert ABI48_0_0RNSVGLength:json];
}
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(maskUnits, ABI48_0_0RNSVGUnits)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(maskContentUnits, ABI48_0_0RNSVGUnits)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(maskTransform, CGAffineTransform)

@end
