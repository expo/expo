/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI47_0_0RNSVGCircleManager.h"

#import "ABI47_0_0RCTConvert+RNSVG.h"
#import "ABI47_0_0RNSVGCircle.h"

@implementation ABI47_0_0RNSVGCircleManager

ABI47_0_0RCT_EXPORT_MODULE()

- (ABI47_0_0RNSVGRenderable *)node
{
  return [ABI47_0_0RNSVGCircle new];
}

ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(cx, ABI47_0_0RNSVGLength *)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(cy, ABI47_0_0RNSVGLength *)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(r, ABI47_0_0RNSVGLength *)

@end
