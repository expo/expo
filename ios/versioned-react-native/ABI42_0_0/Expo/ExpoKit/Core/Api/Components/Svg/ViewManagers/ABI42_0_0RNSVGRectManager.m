/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI42_0_0RNSVGRectManager.h"

#import "ABI42_0_0RNSVGRect.h"
#import "ABI42_0_0RCTConvert+RNSVG.h"

@implementation ABI42_0_0RNSVGRectManager

ABI42_0_0RCT_EXPORT_MODULE()

- (ABI42_0_0RNSVGRenderable *)node
{
  return [ABI42_0_0RNSVGRect new];
}

ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(x, ABI42_0_0RNSVGLength*)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(y, ABI42_0_0RNSVGLength*)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(rectheight, ABI42_0_0RNSVGLength*)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(rectwidth, ABI42_0_0RNSVGLength*)
ABI42_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI42_0_0RNSVGRect)
{
    view.rectheight = [ABI42_0_0RCTConvert ABI42_0_0RNSVGLength:json];
}

ABI42_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI42_0_0RNSVGRect)
{
    view.rectwidth = [ABI42_0_0RCTConvert ABI42_0_0RNSVGLength:json];
}
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(rx, ABI42_0_0RNSVGLength*)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(ry, ABI42_0_0RNSVGLength*)

@end
