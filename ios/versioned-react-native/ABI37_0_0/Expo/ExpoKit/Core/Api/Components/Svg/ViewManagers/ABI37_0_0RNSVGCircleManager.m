/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI37_0_0RNSVGCircleManager.h"

#import "ABI37_0_0RNSVGCircle.h"
#import "ABI37_0_0RCTConvert+RNSVG.h"

@implementation ABI37_0_0RNSVGCircleManager

ABI37_0_0RCT_EXPORT_MODULE()

- (ABI37_0_0RNSVGRenderable *)node
{
    return [ABI37_0_0RNSVGCircle new];
}

ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(cx, ABI37_0_0RNSVGLength*)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(cy, ABI37_0_0RNSVGLength*)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(r, ABI37_0_0RNSVGLength*)

@end
