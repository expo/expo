/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI43_0_0RNSVGCircleManager.h"

#import "ABI43_0_0RNSVGCircle.h"
#import "ABI43_0_0RCTConvert+RNSVG.h"

@implementation ABI43_0_0RNSVGCircleManager

ABI43_0_0RCT_EXPORT_MODULE()

- (ABI43_0_0RNSVGRenderable *)node
{
    return [ABI43_0_0RNSVGCircle new];
}

ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(cx, ABI43_0_0RNSVGLength*)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(cy, ABI43_0_0RNSVGLength*)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(r, ABI43_0_0RNSVGLength*)

@end
