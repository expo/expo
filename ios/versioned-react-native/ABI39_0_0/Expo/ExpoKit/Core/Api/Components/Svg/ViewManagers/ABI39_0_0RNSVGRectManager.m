/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI39_0_0RNSVGRectManager.h"

#import "ABI39_0_0RNSVGRect.h"
#import "ABI39_0_0RCTConvert+RNSVG.h"

@implementation ABI39_0_0RNSVGRectManager

ABI39_0_0RCT_EXPORT_MODULE()

- (ABI39_0_0RNSVGRenderable *)node
{
  return [ABI39_0_0RNSVGRect new];
}

ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(x, ABI39_0_0RNSVGLength*)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(y, ABI39_0_0RNSVGLength*)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(rectheight, ABI39_0_0RNSVGLength*)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(rectwidth, ABI39_0_0RNSVGLength*)
ABI39_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI39_0_0RNSVGRect)
{
    view.rectheight = [ABI39_0_0RCTConvert ABI39_0_0RNSVGLength:json];
}

ABI39_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI39_0_0RNSVGRect)
{
    view.rectwidth = [ABI39_0_0RCTConvert ABI39_0_0RNSVGLength:json];
}
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(rx, ABI39_0_0RNSVGLength*)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(ry, ABI39_0_0RNSVGLength*)

@end
