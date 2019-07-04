/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI31_0_0RNSVGRectManager.h"

#import "ABI31_0_0RNSVGRect.h"
#import "ABI31_0_0RCTConvert+RNSVG.h"

@implementation ABI31_0_0RNSVGRectManager

ABI31_0_0RCT_EXPORT_MODULE()

- (ABI31_0_0RNSVGRenderable *)node
{
  return [ABI31_0_0RNSVGRect new];
}

ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(x, ABI31_0_0RNSVGLength*)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(y, ABI31_0_0RNSVGLength*)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(rectheight, ABI31_0_0RNSVGLength*)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(rectwidth, ABI31_0_0RNSVGLength*)
ABI31_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI31_0_0RNSVGRect)
{
    view.rectheight = [ABI31_0_0RCTConvert ABI31_0_0RNSVGLength:json];
}

ABI31_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI31_0_0RNSVGRect)
{
    view.rectwidth = [ABI31_0_0RCTConvert ABI31_0_0RNSVGLength:json];
}
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(rx, ABI31_0_0RNSVGLength*)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(ry, ABI31_0_0RNSVGLength*)

@end
