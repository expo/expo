/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI15_0_0RNSVGCircleManager.h"

#import "ABI15_0_0RNSVGCircle.h"
#import "ABI15_0_0RCTConvert+RNSVG.h"

@implementation ABI15_0_0RNSVGCircleManager

ABI15_0_0RCT_EXPORT_MODULE()

- (ABI15_0_0RNSVGRenderable *)node
{
    return [ABI15_0_0RNSVGCircle new];
}

ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(cx, NSString)
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(cy, NSString)
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(r, NSString)

@end
