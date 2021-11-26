/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RNSVGRectManager.h"

#import "RNSVGRect.h"
#import "RCTConvert+RNSVG.h"

@implementation RNSVGRectManager

RCT_EXPORT_MODULE()

- (RNSVGRenderable *)node
{
  return [RNSVGRect new];
}

RCT_EXPORT_VIEW_PROPERTY(x, RNSVGLength*)
RCT_EXPORT_VIEW_PROPERTY(y, RNSVGLength*)
RCT_EXPORT_VIEW_PROPERTY(rectheight, RNSVGLength*)
RCT_EXPORT_VIEW_PROPERTY(rectwidth, RNSVGLength*)
RCT_CUSTOM_VIEW_PROPERTY(height, id, RNSVGRect)
{
    view.rectheight = [RCTConvert RNSVGLength:json];
}

RCT_CUSTOM_VIEW_PROPERTY(width, id, RNSVGRect)
{
    view.rectwidth = [RCTConvert RNSVGLength:json];
}
RCT_EXPORT_VIEW_PROPERTY(rx, RNSVGLength*)
RCT_EXPORT_VIEW_PROPERTY(ry, RNSVGLength*)

@end
