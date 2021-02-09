/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI39_0_0RNSVGEllipseManager.h"

#import "ABI39_0_0RNSVGEllipse.h"
#import "ABI39_0_0RCTConvert+RNSVG.h"

@implementation ABI39_0_0RNSVGEllipseManager

ABI39_0_0RCT_EXPORT_MODULE()

- (ABI39_0_0RNSVGRenderable *)node
{
  return [ABI39_0_0RNSVGEllipse new];
}

ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(cx, ABI39_0_0RNSVGLength*)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(cy, ABI39_0_0RNSVGLength*)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(rx, ABI39_0_0RNSVGLength*)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(ry, ABI39_0_0RNSVGLength*)

@end
