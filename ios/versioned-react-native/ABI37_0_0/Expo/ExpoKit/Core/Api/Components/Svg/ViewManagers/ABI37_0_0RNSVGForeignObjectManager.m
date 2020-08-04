/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI37_0_0RNSVGForeignObjectManager.h"
#import "ABI37_0_0RNSVGForeignObject.h"

@implementation ABI37_0_0RNSVGForeignObjectManager

ABI37_0_0RCT_EXPORT_MODULE()

- (ABI37_0_0RNSVGForeignObject *)node
{
    return [ABI37_0_0RNSVGForeignObject new];
}

ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(x, ABI37_0_0RNSVGLength*)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(y, ABI37_0_0RNSVGLength*)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(foreignObjectheight, ABI37_0_0RNSVGLength*)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(foreignObjectwidth, ABI37_0_0RNSVGLength*)
ABI37_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI37_0_0RNSVGForeignObject)
{
    view.foreignObjectheight = [ABI37_0_0RCTConvert ABI37_0_0RNSVGLength:json];
}
ABI37_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI37_0_0RNSVGForeignObject)
{
    view.foreignObjectwidth = [ABI37_0_0RCTConvert ABI37_0_0RNSVGLength:json];
}

@end
