/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI43_0_0RNSVGRectManager.h"

#import "ABI43_0_0RNSVGRect.h"
#import "ABI43_0_0RCTConvert+RNSVG.h"

@implementation ABI43_0_0RNSVGRectManager

ABI43_0_0RCT_EXPORT_MODULE()

- (ABI43_0_0RNSVGRenderable *)node
{
  return [ABI43_0_0RNSVGRect new];
}

ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(x, ABI43_0_0RNSVGLength*)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(y, ABI43_0_0RNSVGLength*)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(rectheight, ABI43_0_0RNSVGLength*)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(rectwidth, ABI43_0_0RNSVGLength*)
ABI43_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI43_0_0RNSVGRect)
{
    view.rectheight = [ABI43_0_0RCTConvert ABI43_0_0RNSVGLength:json];
}

ABI43_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI43_0_0RNSVGRect)
{
    view.rectwidth = [ABI43_0_0RCTConvert ABI43_0_0RNSVGLength:json];
}
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(rx, ABI43_0_0RNSVGLength*)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(ry, ABI43_0_0RNSVGLength*)

@end
