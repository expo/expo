/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI44_0_0RNSVGRectManager.h"

#import "ABI44_0_0RNSVGRect.h"
#import "ABI44_0_0RCTConvert+RNSVG.h"

@implementation ABI44_0_0RNSVGRectManager

ABI44_0_0RCT_EXPORT_MODULE()

- (ABI44_0_0RNSVGRenderable *)node
{
  return [ABI44_0_0RNSVGRect new];
}

ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(x, ABI44_0_0RNSVGLength*)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(y, ABI44_0_0RNSVGLength*)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(rectheight, ABI44_0_0RNSVGLength*)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(rectwidth, ABI44_0_0RNSVGLength*)
ABI44_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI44_0_0RNSVGRect)
{
    view.rectheight = [ABI44_0_0RCTConvert ABI44_0_0RNSVGLength:json];
}

ABI44_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI44_0_0RNSVGRect)
{
    view.rectwidth = [ABI44_0_0RCTConvert ABI44_0_0RNSVGLength:json];
}
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(rx, ABI44_0_0RNSVGLength*)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(ry, ABI44_0_0RNSVGLength*)

@end
