/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI36_0_0RNSVGRectManager.h"

#import "ABI36_0_0RNSVGRect.h"
#import "ABI36_0_0RCTConvert+RNSVG.h"

@implementation ABI36_0_0RNSVGRectManager

ABI36_0_0RCT_EXPORT_MODULE()

- (ABI36_0_0RNSVGRenderable *)node
{
  return [ABI36_0_0RNSVGRect new];
}

ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(x, ABI36_0_0RNSVGLength*)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(y, ABI36_0_0RNSVGLength*)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(rectheight, ABI36_0_0RNSVGLength*)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(rectwidth, ABI36_0_0RNSVGLength*)
ABI36_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI36_0_0RNSVGRect)
{
    view.rectheight = [ABI36_0_0RCTConvert ABI36_0_0RNSVGLength:json];
}

ABI36_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI36_0_0RNSVGRect)
{
    view.rectwidth = [ABI36_0_0RCTConvert ABI36_0_0RNSVGLength:json];
}
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(rx, ABI36_0_0RNSVGLength*)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(ry, ABI36_0_0RNSVGLength*)

@end
