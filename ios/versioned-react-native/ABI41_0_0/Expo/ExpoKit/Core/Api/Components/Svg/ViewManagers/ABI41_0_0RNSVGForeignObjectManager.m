/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI41_0_0RNSVGForeignObjectManager.h"
#import "ABI41_0_0RNSVGForeignObject.h"

@implementation ABI41_0_0RNSVGForeignObjectManager

ABI41_0_0RCT_EXPORT_MODULE()

- (ABI41_0_0RNSVGForeignObject *)node
{
    return [ABI41_0_0RNSVGForeignObject new];
}

ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(x, ABI41_0_0RNSVGLength*)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(y, ABI41_0_0RNSVGLength*)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(foreignObjectheight, ABI41_0_0RNSVGLength*)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(foreignObjectwidth, ABI41_0_0RNSVGLength*)
ABI41_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI41_0_0RNSVGForeignObject)
{
    view.foreignObjectheight = [ABI41_0_0RCTConvert ABI41_0_0RNSVGLength:json];
}
ABI41_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI41_0_0RNSVGForeignObject)
{
    view.foreignObjectwidth = [ABI41_0_0RCTConvert ABI41_0_0RNSVGLength:json];
}

@end
