/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI9_0_0RNSVGCircleManager.h"

#import "ABI9_0_0RNSVGCircle.h"
#import "ABI9_0_0RCTConvert+RNSVG.h"

@implementation ABI9_0_0RNSVGCircleManager

ABI9_0_0RCT_EXPORT_MODULE()

- (ABI9_0_0RNSVGRenderable *)node
{
    return [ABI9_0_0RNSVGCircle new];
}

ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(cx, NSString)
ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(cy, NSString)
ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(r, NSString)

@end
