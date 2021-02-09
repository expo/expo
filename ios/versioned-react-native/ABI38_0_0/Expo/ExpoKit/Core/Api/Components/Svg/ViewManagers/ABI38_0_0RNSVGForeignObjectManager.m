/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI38_0_0RNSVGForeignObjectManager.h"
#import "ABI38_0_0RNSVGForeignObject.h"

@implementation ABI38_0_0RNSVGForeignObjectManager

ABI38_0_0RCT_EXPORT_MODULE()

- (ABI38_0_0RNSVGForeignObject *)node
{
    return [ABI38_0_0RNSVGForeignObject new];
}

ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(x, ABI38_0_0RNSVGLength*)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(y, ABI38_0_0RNSVGLength*)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(foreignObjectheight, ABI38_0_0RNSVGLength*)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(foreignObjectwidth, ABI38_0_0RNSVGLength*)
ABI38_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI38_0_0RNSVGForeignObject)
{
    view.foreignObjectheight = [ABI38_0_0RCTConvert ABI38_0_0RNSVGLength:json];
}
ABI38_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI38_0_0RNSVGForeignObject)
{
    view.foreignObjectwidth = [ABI38_0_0RCTConvert ABI38_0_0RNSVGLength:json];
}

@end
