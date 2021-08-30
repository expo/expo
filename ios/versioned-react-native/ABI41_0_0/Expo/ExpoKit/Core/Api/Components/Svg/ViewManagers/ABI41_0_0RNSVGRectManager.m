/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI41_0_0RNSVGRectManager.h"

#import "ABI41_0_0RNSVGRect.h"
#import "ABI41_0_0RCTConvert+RNSVG.h"

@implementation ABI41_0_0RNSVGRectManager

ABI41_0_0RCT_EXPORT_MODULE()

- (ABI41_0_0RNSVGRenderable *)node
{
  return [ABI41_0_0RNSVGRect new];
}

ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(x, ABI41_0_0RNSVGLength*)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(y, ABI41_0_0RNSVGLength*)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(rectheight, ABI41_0_0RNSVGLength*)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(rectwidth, ABI41_0_0RNSVGLength*)
ABI41_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI41_0_0RNSVGRect)
{
    view.rectheight = [ABI41_0_0RCTConvert ABI41_0_0RNSVGLength:json];
}

ABI41_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI41_0_0RNSVGRect)
{
    view.rectwidth = [ABI41_0_0RCTConvert ABI41_0_0RNSVGLength:json];
}
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(rx, ABI41_0_0RNSVGLength*)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(ry, ABI41_0_0RNSVGLength*)

@end
