/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI42_0_0RNSVGCircleManager.h"

#import "ABI42_0_0RNSVGCircle.h"
#import "ABI42_0_0RCTConvert+RNSVG.h"

@implementation ABI42_0_0RNSVGCircleManager

ABI42_0_0RCT_EXPORT_MODULE()

- (ABI42_0_0RNSVGRenderable *)node
{
    return [ABI42_0_0RNSVGCircle new];
}

ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(cx, ABI42_0_0RNSVGLength*)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(cy, ABI42_0_0RNSVGLength*)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(r, ABI42_0_0RNSVGLength*)

@end
