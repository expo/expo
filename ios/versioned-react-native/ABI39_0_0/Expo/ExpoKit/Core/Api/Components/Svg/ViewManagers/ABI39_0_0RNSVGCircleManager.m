/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI39_0_0RNSVGCircleManager.h"

#import "ABI39_0_0RNSVGCircle.h"
#import "ABI39_0_0RCTConvert+RNSVG.h"

@implementation ABI39_0_0RNSVGCircleManager

ABI39_0_0RCT_EXPORT_MODULE()

- (ABI39_0_0RNSVGRenderable *)node
{
    return [ABI39_0_0RNSVGCircle new];
}

ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(cx, ABI39_0_0RNSVGLength*)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(cy, ABI39_0_0RNSVGLength*)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(r, ABI39_0_0RNSVGLength*)

@end
