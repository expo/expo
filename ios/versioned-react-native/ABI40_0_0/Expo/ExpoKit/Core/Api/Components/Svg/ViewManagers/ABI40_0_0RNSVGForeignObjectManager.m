/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI40_0_0RNSVGForeignObjectManager.h"
#import "ABI40_0_0RNSVGForeignObject.h"

@implementation ABI40_0_0RNSVGForeignObjectManager

ABI40_0_0RCT_EXPORT_MODULE()

- (ABI40_0_0RNSVGForeignObject *)node
{
    return [ABI40_0_0RNSVGForeignObject new];
}

ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(x, ABI40_0_0RNSVGLength*)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(y, ABI40_0_0RNSVGLength*)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(foreignObjectheight, ABI40_0_0RNSVGLength*)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(foreignObjectwidth, ABI40_0_0RNSVGLength*)
ABI40_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI40_0_0RNSVGForeignObject)
{
    view.foreignObjectheight = [ABI40_0_0RCTConvert ABI40_0_0RNSVGLength:json];
}
ABI40_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI40_0_0RNSVGForeignObject)
{
    view.foreignObjectwidth = [ABI40_0_0RCTConvert ABI40_0_0RNSVGLength:json];
}

@end
