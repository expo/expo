/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI34_0_0RNSVGUseManager.h"
#import "ABI34_0_0RNSVGUse.h"

@implementation ABI34_0_0RNSVGUseManager

ABI34_0_0RCT_EXPORT_MODULE()

- (ABI34_0_0RNSVGNode *)node
{
  return [ABI34_0_0RNSVGUse new];
}

ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(href, NSString)
ABI34_0_0RCT_CUSTOM_VIEW_PROPERTY(x, id, ABI34_0_0RNSVGUse)
{
    view.x = [ABI34_0_0RCTConvert ABI34_0_0RNSVGLength:json];
}
ABI34_0_0RCT_CUSTOM_VIEW_PROPERTY(y, id, ABI34_0_0RNSVGUse)
{
    view.y = [ABI34_0_0RCTConvert ABI34_0_0RNSVGLength:json];
}
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(useheight, ABI34_0_0RNSVGLength*)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(usewidth, ABI34_0_0RNSVGLength*)
ABI34_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI34_0_0RNSVGUse)
{
    view.useheight = [ABI34_0_0RCTConvert ABI34_0_0RNSVGLength:json];
}
ABI34_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI34_0_0RNSVGUse)
{
    view.usewidth = [ABI34_0_0RCTConvert ABI34_0_0RNSVGLength:json];
}

@end
