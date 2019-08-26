/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI32_0_0RNSVGRectManager.h"

#import "ABI32_0_0RNSVGRect.h"
#import "ABI32_0_0RCTConvert+RNSVG.h"

@implementation ABI32_0_0RNSVGRectManager

ABI32_0_0RCT_EXPORT_MODULE()

- (ABI32_0_0RNSVGRenderable *)node
{
  return [ABI32_0_0RNSVGRect new];
}

ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(x, ABI32_0_0RNSVGLength*)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(y, ABI32_0_0RNSVGLength*)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(rectheight, ABI32_0_0RNSVGLength*)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(rectwidth, ABI32_0_0RNSVGLength*)
ABI32_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI32_0_0RNSVGRect)
{
    view.rectheight = [ABI32_0_0RCTConvert ABI32_0_0RNSVGLength:json];
}

ABI32_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI32_0_0RNSVGRect)
{
    view.rectwidth = [ABI32_0_0RCTConvert ABI32_0_0RNSVGLength:json];
}
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(rx, ABI32_0_0RNSVGLength*)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(ry, ABI32_0_0RNSVGLength*)

@end
