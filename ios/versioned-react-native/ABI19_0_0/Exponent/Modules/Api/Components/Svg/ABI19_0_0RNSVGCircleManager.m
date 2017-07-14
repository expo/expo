/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI19_0_0RNSVGCircleManager.h"

#import "ABI19_0_0RNSVGCircle.h"
#import "ABI19_0_0RCTConvert+RNSVG.h"

@implementation ABI19_0_0RNSVGCircleManager

ABI19_0_0RCT_EXPORT_MODULE()

- (ABI19_0_0RNSVGRenderable *)node
{
    return [ABI19_0_0RNSVGCircle new];
}

ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(cx, NSString)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(cy, NSString)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(r, NSString)

@end
