/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI44_0_0RNSVGUseManager.h"
#import "ABI44_0_0RNSVGUse.h"

@implementation ABI44_0_0RNSVGUseManager

ABI44_0_0RCT_EXPORT_MODULE()

- (ABI44_0_0RNSVGNode *)node
{
  return [ABI44_0_0RNSVGUse new];
}

ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(href, NSString)
ABI44_0_0RCT_CUSTOM_VIEW_PROPERTY(x, id, ABI44_0_0RNSVGUse)
{
    view.x = [ABI44_0_0RCTConvert ABI44_0_0RNSVGLength:json];
}
ABI44_0_0RCT_CUSTOM_VIEW_PROPERTY(y, id, ABI44_0_0RNSVGUse)
{
    view.y = [ABI44_0_0RCTConvert ABI44_0_0RNSVGLength:json];
}
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(useheight, ABI44_0_0RNSVGLength*)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(usewidth, ABI44_0_0RNSVGLength*)
ABI44_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI44_0_0RNSVGUse)
{
    view.useheight = [ABI44_0_0RCTConvert ABI44_0_0RNSVGLength:json];
}
ABI44_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI44_0_0RNSVGUse)
{
    view.usewidth = [ABI44_0_0RCTConvert ABI44_0_0RNSVGLength:json];
}

@end
