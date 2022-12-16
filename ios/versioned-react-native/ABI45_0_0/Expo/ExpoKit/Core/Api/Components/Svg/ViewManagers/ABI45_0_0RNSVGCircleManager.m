/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI45_0_0RNSVGCircleManager.h"

#import "ABI45_0_0RNSVGCircle.h"
#import "ABI45_0_0RCTConvert+RNSVG.h"

@implementation ABI45_0_0RNSVGCircleManager

ABI45_0_0RCT_EXPORT_MODULE()

- (ABI45_0_0RNSVGRenderable *)node
{
    return [ABI45_0_0RNSVGCircle new];
}

ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(cx, ABI45_0_0RNSVGLength*)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(cy, ABI45_0_0RNSVGLength*)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(r, ABI45_0_0RNSVGLength*)

@end
