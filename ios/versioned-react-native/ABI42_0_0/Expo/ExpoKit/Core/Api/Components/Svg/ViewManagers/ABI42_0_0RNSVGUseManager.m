/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI42_0_0RNSVGUseManager.h"
#import "ABI42_0_0RNSVGUse.h"

@implementation ABI42_0_0RNSVGUseManager

ABI42_0_0RCT_EXPORT_MODULE()

- (ABI42_0_0RNSVGNode *)node
{
  return [ABI42_0_0RNSVGUse new];
}

ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(href, NSString)
ABI42_0_0RCT_CUSTOM_VIEW_PROPERTY(x, id, ABI42_0_0RNSVGUse)
{
    view.x = [ABI42_0_0RCTConvert ABI42_0_0RNSVGLength:json];
}
ABI42_0_0RCT_CUSTOM_VIEW_PROPERTY(y, id, ABI42_0_0RNSVGUse)
{
    view.y = [ABI42_0_0RCTConvert ABI42_0_0RNSVGLength:json];
}
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(useheight, ABI42_0_0RNSVGLength*)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(usewidth, ABI42_0_0RNSVGLength*)
ABI42_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI42_0_0RNSVGUse)
{
    view.useheight = [ABI42_0_0RCTConvert ABI42_0_0RNSVGLength:json];
}
ABI42_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI42_0_0RNSVGUse)
{
    view.usewidth = [ABI42_0_0RCTConvert ABI42_0_0RNSVGLength:json];
}

@end
