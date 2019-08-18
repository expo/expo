/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI33_0_0RNSVGRectManager.h"

#import "ABI33_0_0RNSVGRect.h"
#import "ABI33_0_0RCTConvert+RNSVG.h"

@implementation ABI33_0_0RNSVGRectManager

ABI33_0_0RCT_EXPORT_MODULE()

- (ABI33_0_0RNSVGRenderable *)node
{
  return [ABI33_0_0RNSVGRect new];
}

ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(x, ABI33_0_0RNSVGLength*)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(y, ABI33_0_0RNSVGLength*)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(rectheight, ABI33_0_0RNSVGLength*)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(rectwidth, ABI33_0_0RNSVGLength*)
ABI33_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI33_0_0RNSVGRect)
{
    view.rectheight = [ABI33_0_0RCTConvert ABI33_0_0RNSVGLength:json];
}

ABI33_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI33_0_0RNSVGRect)
{
    view.rectwidth = [ABI33_0_0RCTConvert ABI33_0_0RNSVGLength:json];
}
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(rx, ABI33_0_0RNSVGLength*)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(ry, ABI33_0_0RNSVGLength*)

@end
