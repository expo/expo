/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI42_0_0RNSVGForeignObjectManager.h"
#import "ABI42_0_0RNSVGForeignObject.h"

@implementation ABI42_0_0RNSVGForeignObjectManager

ABI42_0_0RCT_EXPORT_MODULE()

- (ABI42_0_0RNSVGForeignObject *)node
{
    return [ABI42_0_0RNSVGForeignObject new];
}

ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(x, ABI42_0_0RNSVGLength*)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(y, ABI42_0_0RNSVGLength*)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(foreignObjectheight, ABI42_0_0RNSVGLength*)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(foreignObjectwidth, ABI42_0_0RNSVGLength*)
ABI42_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI42_0_0RNSVGForeignObject)
{
    view.foreignObjectheight = [ABI42_0_0RCTConvert ABI42_0_0RNSVGLength:json];
}
ABI42_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI42_0_0RNSVGForeignObject)
{
    view.foreignObjectwidth = [ABI42_0_0RCTConvert ABI42_0_0RNSVGLength:json];
}

@end
