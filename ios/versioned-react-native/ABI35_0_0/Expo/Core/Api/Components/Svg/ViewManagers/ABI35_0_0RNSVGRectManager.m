/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI35_0_0RNSVGRectManager.h"

#import "ABI35_0_0RNSVGRect.h"
#import "ABI35_0_0RCTConvert+RNSVG.h"

@implementation ABI35_0_0RNSVGRectManager

ABI35_0_0RCT_EXPORT_MODULE()

- (ABI35_0_0RNSVGRenderable *)node
{
  return [ABI35_0_0RNSVGRect new];
}

ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(x, ABI35_0_0RNSVGLength*)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(y, ABI35_0_0RNSVGLength*)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(rectheight, ABI35_0_0RNSVGLength*)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(rectwidth, ABI35_0_0RNSVGLength*)
ABI35_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI35_0_0RNSVGRect)
{
    view.rectheight = [ABI35_0_0RCTConvert ABI35_0_0RNSVGLength:json];
}

ABI35_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI35_0_0RNSVGRect)
{
    view.rectwidth = [ABI35_0_0RCTConvert ABI35_0_0RNSVGLength:json];
}
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(rx, ABI35_0_0RNSVGLength*)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(ry, ABI35_0_0RNSVGLength*)

@end
