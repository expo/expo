/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI32_0_0RNSVGUseManager.h"
#import "ABI32_0_0RNSVGUse.h"

@implementation ABI32_0_0RNSVGUseManager

ABI32_0_0RCT_EXPORT_MODULE()

- (ABI32_0_0RNSVGNode *)node
{
  return [ABI32_0_0RNSVGUse new];
}

ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(href, NSString)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(useheight, ABI32_0_0RNSVGLength*)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(usewidth, ABI32_0_0RNSVGLength*)
ABI32_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI32_0_0RNSVGUse)
{
    view.useheight = [ABI32_0_0RCTConvert ABI32_0_0RNSVGLength:json];
}
ABI32_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI32_0_0RNSVGUse)
{
    view.usewidth = [ABI32_0_0RCTConvert ABI32_0_0RNSVGLength:json];
}

@end
