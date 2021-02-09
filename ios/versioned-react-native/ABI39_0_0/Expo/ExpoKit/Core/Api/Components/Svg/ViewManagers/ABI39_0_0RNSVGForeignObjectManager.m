/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI39_0_0RNSVGForeignObjectManager.h"
#import "ABI39_0_0RNSVGForeignObject.h"

@implementation ABI39_0_0RNSVGForeignObjectManager

ABI39_0_0RCT_EXPORT_MODULE()

- (ABI39_0_0RNSVGForeignObject *)node
{
    return [ABI39_0_0RNSVGForeignObject new];
}

ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(x, ABI39_0_0RNSVGLength*)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(y, ABI39_0_0RNSVGLength*)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(foreignObjectheight, ABI39_0_0RNSVGLength*)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(foreignObjectwidth, ABI39_0_0RNSVGLength*)
ABI39_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI39_0_0RNSVGForeignObject)
{
    view.foreignObjectheight = [ABI39_0_0RCTConvert ABI39_0_0RNSVGLength:json];
}
ABI39_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI39_0_0RNSVGForeignObject)
{
    view.foreignObjectwidth = [ABI39_0_0RCTConvert ABI39_0_0RNSVGLength:json];
}

@end
