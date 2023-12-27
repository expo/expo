/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI43_0_0RNSVGForeignObjectManager.h"
#import "ABI43_0_0RNSVGForeignObject.h"

@implementation ABI43_0_0RNSVGForeignObjectManager

ABI43_0_0RCT_EXPORT_MODULE()

- (ABI43_0_0RNSVGForeignObject *)node
{
    return [ABI43_0_0RNSVGForeignObject new];
}

ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(x, ABI43_0_0RNSVGLength*)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(y, ABI43_0_0RNSVGLength*)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(foreignObjectheight, ABI43_0_0RNSVGLength*)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(foreignObjectwidth, ABI43_0_0RNSVGLength*)
ABI43_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI43_0_0RNSVGForeignObject)
{
    view.foreignObjectheight = [ABI43_0_0RCTConvert ABI43_0_0RNSVGLength:json];
}
ABI43_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI43_0_0RNSVGForeignObject)
{
    view.foreignObjectwidth = [ABI43_0_0RCTConvert ABI43_0_0RNSVGLength:json];
}

@end
