/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI44_0_0RNSVGForeignObjectManager.h"
#import "ABI44_0_0RNSVGForeignObject.h"

@implementation ABI44_0_0RNSVGForeignObjectManager

ABI44_0_0RCT_EXPORT_MODULE()

- (ABI44_0_0RNSVGForeignObject *)node
{
    return [ABI44_0_0RNSVGForeignObject new];
}

ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(x, ABI44_0_0RNSVGLength*)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(y, ABI44_0_0RNSVGLength*)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(foreignObjectheight, ABI44_0_0RNSVGLength*)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(foreignObjectwidth, ABI44_0_0RNSVGLength*)
ABI44_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI44_0_0RNSVGForeignObject)
{
    view.foreignObjectheight = [ABI44_0_0RCTConvert ABI44_0_0RNSVGLength:json];
}
ABI44_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI44_0_0RNSVGForeignObject)
{
    view.foreignObjectwidth = [ABI44_0_0RCTConvert ABI44_0_0RNSVGLength:json];
}

@end
