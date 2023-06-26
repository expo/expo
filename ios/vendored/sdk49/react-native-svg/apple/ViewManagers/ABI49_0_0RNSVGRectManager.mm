/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI49_0_0RNSVGRectManager.h"

#import "ABI49_0_0RCTConvert+RNSVG.h"
#import "ABI49_0_0RNSVGRect.h"

@implementation ABI49_0_0RNSVGRectManager

ABI49_0_0RCT_EXPORT_MODULE()

- (ABI49_0_0RNSVGRenderable *)node
{
  return [ABI49_0_0RNSVGRect new];
}

ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(x, ABI49_0_0RNSVGLength *)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(y, ABI49_0_0RNSVGLength *)
ABI49_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI49_0_0RNSVGRect)
{
  view.rectheight = [ABI49_0_0RCTConvert ABI49_0_0RNSVGLength:json];
}

ABI49_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI49_0_0RNSVGRect)
{
  view.rectwidth = [ABI49_0_0RCTConvert ABI49_0_0RNSVGLength:json];
}
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(rx, ABI49_0_0RNSVGLength *)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(ry, ABI49_0_0RNSVGLength *)

@end
