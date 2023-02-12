/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI46_0_0RNSVGForeignObjectManager.h"
#import "ABI46_0_0RNSVGForeignObject.h"

@implementation ABI46_0_0RNSVGForeignObjectManager

ABI46_0_0RCT_EXPORT_MODULE()

- (ABI46_0_0RNSVGForeignObject *)node
{
    return [ABI46_0_0RNSVGForeignObject new];
}

ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(x, ABI46_0_0RNSVGLength*)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(y, ABI46_0_0RNSVGLength*)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(foreignObjectheight, ABI46_0_0RNSVGLength*)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(foreignObjectwidth, ABI46_0_0RNSVGLength*)
ABI46_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI46_0_0RNSVGForeignObject)
{
    view.foreignObjectheight = [ABI46_0_0RCTConvert ABI46_0_0RNSVGLength:json];
}
ABI46_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI46_0_0RNSVGForeignObject)
{
    view.foreignObjectwidth = [ABI46_0_0RCTConvert ABI46_0_0RNSVGLength:json];
}

@end
