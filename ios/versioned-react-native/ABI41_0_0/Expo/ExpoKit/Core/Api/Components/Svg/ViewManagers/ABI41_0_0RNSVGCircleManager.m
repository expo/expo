/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI41_0_0RNSVGCircleManager.h"

#import "ABI41_0_0RNSVGCircle.h"
#import "ABI41_0_0RCTConvert+RNSVG.h"

@implementation ABI41_0_0RNSVGCircleManager

ABI41_0_0RCT_EXPORT_MODULE()

- (ABI41_0_0RNSVGRenderable *)node
{
    return [ABI41_0_0RNSVGCircle new];
}

ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(cx, ABI41_0_0RNSVGLength*)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(cy, ABI41_0_0RNSVGLength*)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(r, ABI41_0_0RNSVGLength*)

@end
