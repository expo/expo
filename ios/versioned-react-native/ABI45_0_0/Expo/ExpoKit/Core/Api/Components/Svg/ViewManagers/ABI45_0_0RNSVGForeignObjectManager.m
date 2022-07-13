/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI45_0_0RNSVGForeignObjectManager.h"
#import "ABI45_0_0RNSVGForeignObject.h"

@implementation ABI45_0_0RNSVGForeignObjectManager

ABI45_0_0RCT_EXPORT_MODULE()

- (ABI45_0_0RNSVGForeignObject *)node
{
    return [ABI45_0_0RNSVGForeignObject new];
}

ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(x, ABI45_0_0RNSVGLength*)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(y, ABI45_0_0RNSVGLength*)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(foreignObjectheight, ABI45_0_0RNSVGLength*)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(foreignObjectwidth, ABI45_0_0RNSVGLength*)
ABI45_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI45_0_0RNSVGForeignObject)
{
    view.foreignObjectheight = [ABI45_0_0RCTConvert ABI45_0_0RNSVGLength:json];
}
ABI45_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI45_0_0RNSVGForeignObject)
{
    view.foreignObjectwidth = [ABI45_0_0RCTConvert ABI45_0_0RNSVGLength:json];
}

@end
