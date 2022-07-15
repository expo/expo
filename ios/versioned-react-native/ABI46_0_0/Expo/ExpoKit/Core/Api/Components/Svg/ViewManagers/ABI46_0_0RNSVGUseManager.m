/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI46_0_0RNSVGUseManager.h"
#import "ABI46_0_0RNSVGUse.h"

@implementation ABI46_0_0RNSVGUseManager

ABI46_0_0RCT_EXPORT_MODULE()

- (ABI46_0_0RNSVGNode *)node
{
  return [ABI46_0_0RNSVGUse new];
}

ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(href, NSString)
ABI46_0_0RCT_CUSTOM_VIEW_PROPERTY(x, id, ABI46_0_0RNSVGUse)
{
    view.x = [ABI46_0_0RCTConvert ABI46_0_0RNSVGLength:json];
}
ABI46_0_0RCT_CUSTOM_VIEW_PROPERTY(y, id, ABI46_0_0RNSVGUse)
{
    view.y = [ABI46_0_0RCTConvert ABI46_0_0RNSVGLength:json];
}
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(useheight, ABI46_0_0RNSVGLength*)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(usewidth, ABI46_0_0RNSVGLength*)
ABI46_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI46_0_0RNSVGUse)
{
    view.useheight = [ABI46_0_0RCTConvert ABI46_0_0RNSVGLength:json];
}
ABI46_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI46_0_0RNSVGUse)
{
    view.usewidth = [ABI46_0_0RCTConvert ABI46_0_0RNSVGLength:json];
}

@end
