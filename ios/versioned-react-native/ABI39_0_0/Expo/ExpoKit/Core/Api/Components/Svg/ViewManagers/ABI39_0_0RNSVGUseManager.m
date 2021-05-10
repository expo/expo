/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI39_0_0RNSVGUseManager.h"
#import "ABI39_0_0RNSVGUse.h"

@implementation ABI39_0_0RNSVGUseManager

ABI39_0_0RCT_EXPORT_MODULE()

- (ABI39_0_0RNSVGNode *)node
{
  return [ABI39_0_0RNSVGUse new];
}

ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(href, NSString)
ABI39_0_0RCT_CUSTOM_VIEW_PROPERTY(x, id, ABI39_0_0RNSVGUse)
{
    view.x = [ABI39_0_0RCTConvert ABI39_0_0RNSVGLength:json];
}
ABI39_0_0RCT_CUSTOM_VIEW_PROPERTY(y, id, ABI39_0_0RNSVGUse)
{
    view.y = [ABI39_0_0RCTConvert ABI39_0_0RNSVGLength:json];
}
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(useheight, ABI39_0_0RNSVGLength*)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(usewidth, ABI39_0_0RNSVGLength*)
ABI39_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI39_0_0RNSVGUse)
{
    view.useheight = [ABI39_0_0RCTConvert ABI39_0_0RNSVGLength:json];
}
ABI39_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI39_0_0RNSVGUse)
{
    view.usewidth = [ABI39_0_0RCTConvert ABI39_0_0RNSVGLength:json];
}

@end
