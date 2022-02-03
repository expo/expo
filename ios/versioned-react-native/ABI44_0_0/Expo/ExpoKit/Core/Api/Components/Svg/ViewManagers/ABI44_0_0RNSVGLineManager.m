/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI44_0_0RNSVGLineManager.h"

#import "ABI44_0_0RNSVGLine.h"
#import "ABI44_0_0RCTConvert+RNSVG.h"

@implementation ABI44_0_0RNSVGLineManager

ABI44_0_0RCT_EXPORT_MODULE()

- (ABI44_0_0RNSVGRenderable *)node
{
  return [ABI44_0_0RNSVGLine new];
}

ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(x1, ABI44_0_0RNSVGLength*)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(y1, ABI44_0_0RNSVGLength*)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(x2, ABI44_0_0RNSVGLength*)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(y2, ABI44_0_0RNSVGLength*)

@end
