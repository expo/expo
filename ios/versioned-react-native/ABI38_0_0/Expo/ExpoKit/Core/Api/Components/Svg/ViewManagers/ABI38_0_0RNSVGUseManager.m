/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI38_0_0RNSVGUseManager.h"
#import "ABI38_0_0RNSVGUse.h"

@implementation ABI38_0_0RNSVGUseManager

ABI38_0_0RCT_EXPORT_MODULE()

- (ABI38_0_0RNSVGNode *)node
{
  return [ABI38_0_0RNSVGUse new];
}

ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(href, NSString)
ABI38_0_0RCT_CUSTOM_VIEW_PROPERTY(x, id, ABI38_0_0RNSVGUse)
{
    view.x = [ABI38_0_0RCTConvert ABI38_0_0RNSVGLength:json];
}
ABI38_0_0RCT_CUSTOM_VIEW_PROPERTY(y, id, ABI38_0_0RNSVGUse)
{
    view.y = [ABI38_0_0RCTConvert ABI38_0_0RNSVGLength:json];
}
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(useheight, ABI38_0_0RNSVGLength*)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(usewidth, ABI38_0_0RNSVGLength*)
ABI38_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI38_0_0RNSVGUse)
{
    view.useheight = [ABI38_0_0RCTConvert ABI38_0_0RNSVGLength:json];
}
ABI38_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI38_0_0RNSVGUse)
{
    view.usewidth = [ABI38_0_0RCTConvert ABI38_0_0RNSVGLength:json];
}

@end
