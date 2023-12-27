/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI42_0_0RNSVGEllipseManager.h"

#import "ABI42_0_0RNSVGEllipse.h"
#import "ABI42_0_0RCTConvert+RNSVG.h"

@implementation ABI42_0_0RNSVGEllipseManager

ABI42_0_0RCT_EXPORT_MODULE()

- (ABI42_0_0RNSVGRenderable *)node
{
  return [ABI42_0_0RNSVGEllipse new];
}

ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(cx, ABI42_0_0RNSVGLength*)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(cy, ABI42_0_0RNSVGLength*)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(rx, ABI42_0_0RNSVGLength*)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(ry, ABI42_0_0RNSVGLength*)

@end
