/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RNSVGMaskManager.h"
#import "RNSVGMask.h"

@implementation RNSVGMaskManager

RCT_EXPORT_MODULE()

- (RNSVGMask *)node
{
  return [RNSVGMask new];
}

RCT_EXPORT_VIEW_PROPERTY(x, RNSVGLength *)
RCT_EXPORT_VIEW_PROPERTY(y, RNSVGLength *)
RCT_CUSTOM_VIEW_PROPERTY(height, id, RNSVGMask)
{
  view.maskheight = [RCTConvert RNSVGLength:json];
}
RCT_CUSTOM_VIEW_PROPERTY(width, id, RNSVGMask)
{
  view.maskwidth = [RCTConvert RNSVGLength:json];
}
RCT_EXPORT_VIEW_PROPERTY(maskUnits, RNSVGUnits)
RCT_EXPORT_VIEW_PROPERTY(maskContentUnits, RNSVGUnits)

@end
