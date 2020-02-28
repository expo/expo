/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI37_0_0RNSVGRectManager.h"

#import "ABI37_0_0RNSVGRect.h"
#import "ABI37_0_0RCTConvert+RNSVG.h"

@implementation ABI37_0_0RNSVGRectManager

ABI37_0_0RCT_EXPORT_MODULE()

- (ABI37_0_0RNSVGRenderable *)node
{
  return [ABI37_0_0RNSVGRect new];
}

ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(x, ABI37_0_0RNSVGLength*)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(y, ABI37_0_0RNSVGLength*)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(rectheight, ABI37_0_0RNSVGLength*)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(rectwidth, ABI37_0_0RNSVGLength*)
ABI37_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI37_0_0RNSVGRect)
{
    view.rectheight = [ABI37_0_0RCTConvert ABI37_0_0RNSVGLength:json];
}

ABI37_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI37_0_0RNSVGRect)
{
    view.rectwidth = [ABI37_0_0RCTConvert ABI37_0_0RNSVGLength:json];
}
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(rx, ABI37_0_0RNSVGLength*)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(ry, ABI37_0_0RNSVGLength*)

@end
