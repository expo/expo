/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI45_0_0RNSVGRectManager.h"

#import "ABI45_0_0RNSVGRect.h"
#import "ABI45_0_0RCTConvert+RNSVG.h"

@implementation ABI45_0_0RNSVGRectManager

ABI45_0_0RCT_EXPORT_MODULE()

- (ABI45_0_0RNSVGRenderable *)node
{
  return [ABI45_0_0RNSVGRect new];
}

ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(x, ABI45_0_0RNSVGLength*)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(y, ABI45_0_0RNSVGLength*)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(rectheight, ABI45_0_0RNSVGLength*)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(rectwidth, ABI45_0_0RNSVGLength*)
ABI45_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI45_0_0RNSVGRect)
{
    view.rectheight = [ABI45_0_0RCTConvert ABI45_0_0RNSVGLength:json];
}

ABI45_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI45_0_0RNSVGRect)
{
    view.rectwidth = [ABI45_0_0RCTConvert ABI45_0_0RNSVGLength:json];
}
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(rx, ABI45_0_0RNSVGLength*)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(ry, ABI45_0_0RNSVGLength*)

@end
