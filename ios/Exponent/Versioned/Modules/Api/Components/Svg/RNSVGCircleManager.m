/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RNSVGCircleManager.h"

#import "RNSVGCircle.h"
#import "RCTConvert+RNSVG.h"

@implementation RNSVGCircleManager

RCT_EXPORT_MODULE()

- (RNSVGRenderable *)node
{
    return [RNSVGCircle new];
}

RCT_EXPORT_VIEW_PROPERTY(cx, NSString)
RCT_EXPORT_VIEW_PROPERTY(cy, NSString)
RCT_EXPORT_VIEW_PROPERTY(r, NSString)

@end
