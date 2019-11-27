/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI36_0_0RNSVGUseManager.h"
#import "ABI36_0_0RNSVGUse.h"

@implementation ABI36_0_0RNSVGUseManager

ABI36_0_0RCT_EXPORT_MODULE()

- (ABI36_0_0RNSVGNode *)node
{
  return [ABI36_0_0RNSVGUse new];
}

ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(href, NSString)
ABI36_0_0RCT_CUSTOM_VIEW_PROPERTY(x, id, ABI36_0_0RNSVGUse)
{
    view.x = [ABI36_0_0RCTConvert ABI36_0_0RNSVGLength:json];
}
ABI36_0_0RCT_CUSTOM_VIEW_PROPERTY(y, id, ABI36_0_0RNSVGUse)
{
    view.y = [ABI36_0_0RCTConvert ABI36_0_0RNSVGLength:json];
}
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(useheight, ABI36_0_0RNSVGLength*)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(usewidth, ABI36_0_0RNSVGLength*)
ABI36_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI36_0_0RNSVGUse)
{
    view.useheight = [ABI36_0_0RCTConvert ABI36_0_0RNSVGLength:json];
}
ABI36_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI36_0_0RNSVGUse)
{
    view.usewidth = [ABI36_0_0RCTConvert ABI36_0_0RNSVGLength:json];
}

@end
