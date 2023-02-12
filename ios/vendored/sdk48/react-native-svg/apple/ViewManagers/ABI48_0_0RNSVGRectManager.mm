/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI48_0_0RNSVGRectManager.h"

#import "ABI48_0_0RCTConvert+RNSVG.h"
#import "ABI48_0_0RNSVGRect.h"

@implementation ABI48_0_0RNSVGRectManager

ABI48_0_0RCT_EXPORT_MODULE()

- (ABI48_0_0RNSVGRenderable *)node
{
  return [ABI48_0_0RNSVGRect new];
}

ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(x, ABI48_0_0RNSVGLength *)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(y, ABI48_0_0RNSVGLength *)
ABI48_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI48_0_0RNSVGRect)
{
  view.rectheight = [ABI48_0_0RCTConvert ABI48_0_0RNSVGLength:json];
}

ABI48_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI48_0_0RNSVGRect)
{
  view.rectwidth = [ABI48_0_0RCTConvert ABI48_0_0RNSVGLength:json];
}
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(rx, ABI48_0_0RNSVGLength *)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(ry, ABI48_0_0RNSVGLength *)

@end
