/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI38_0_0RNSVGRectManager.h"

#import "ABI38_0_0RNSVGRect.h"
#import "ABI38_0_0RCTConvert+RNSVG.h"

@implementation ABI38_0_0RNSVGRectManager

ABI38_0_0RCT_EXPORT_MODULE()

- (ABI38_0_0RNSVGRenderable *)node
{
  return [ABI38_0_0RNSVGRect new];
}

ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(x, ABI38_0_0RNSVGLength*)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(y, ABI38_0_0RNSVGLength*)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(rectheight, ABI38_0_0RNSVGLength*)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(rectwidth, ABI38_0_0RNSVGLength*)
ABI38_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI38_0_0RNSVGRect)
{
    view.rectheight = [ABI38_0_0RCTConvert ABI38_0_0RNSVGLength:json];
}

ABI38_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI38_0_0RNSVGRect)
{
    view.rectwidth = [ABI38_0_0RCTConvert ABI38_0_0RNSVGLength:json];
}
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(rx, ABI38_0_0RNSVGLength*)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(ry, ABI38_0_0RNSVGLength*)

@end
