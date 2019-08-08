/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI33_0_0RNSVGUseManager.h"
#import "ABI33_0_0RNSVGUse.h"

@implementation ABI33_0_0RNSVGUseManager

ABI33_0_0RCT_EXPORT_MODULE()

- (ABI33_0_0RNSVGNode *)node
{
  return [ABI33_0_0RNSVGUse new];
}

ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(href, NSString)
ABI33_0_0RCT_CUSTOM_VIEW_PROPERTY(x, id, ABI33_0_0RNSVGUse)
{
    view.x = [ABI33_0_0RCTConvert ABI33_0_0RNSVGLength:json];
}
ABI33_0_0RCT_CUSTOM_VIEW_PROPERTY(y, id, ABI33_0_0RNSVGUse)
{
    view.y = [ABI33_0_0RCTConvert ABI33_0_0RNSVGLength:json];
}
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(useheight, ABI33_0_0RNSVGLength*)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(usewidth, ABI33_0_0RNSVGLength*)
ABI33_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI33_0_0RNSVGUse)
{
    view.useheight = [ABI33_0_0RCTConvert ABI33_0_0RNSVGLength:json];
}
ABI33_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI33_0_0RNSVGUse)
{
    view.usewidth = [ABI33_0_0RCTConvert ABI33_0_0RNSVGLength:json];
}

@end
