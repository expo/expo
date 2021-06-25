/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI40_0_0RNSVGUseManager.h"
#import "ABI40_0_0RNSVGUse.h"

@implementation ABI40_0_0RNSVGUseManager

ABI40_0_0RCT_EXPORT_MODULE()

- (ABI40_0_0RNSVGNode *)node
{
  return [ABI40_0_0RNSVGUse new];
}

ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(href, NSString)
ABI40_0_0RCT_CUSTOM_VIEW_PROPERTY(x, id, ABI40_0_0RNSVGUse)
{
    view.x = [ABI40_0_0RCTConvert ABI40_0_0RNSVGLength:json];
}
ABI40_0_0RCT_CUSTOM_VIEW_PROPERTY(y, id, ABI40_0_0RNSVGUse)
{
    view.y = [ABI40_0_0RCTConvert ABI40_0_0RNSVGLength:json];
}
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(useheight, ABI40_0_0RNSVGLength*)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(usewidth, ABI40_0_0RNSVGLength*)
ABI40_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI40_0_0RNSVGUse)
{
    view.useheight = [ABI40_0_0RCTConvert ABI40_0_0RNSVGLength:json];
}
ABI40_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI40_0_0RNSVGUse)
{
    view.usewidth = [ABI40_0_0RCTConvert ABI40_0_0RNSVGLength:json];
}

@end
