/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI47_0_0RNSVGUseManager.h"
#import "ABI47_0_0RNSVGUse.h"

@implementation ABI47_0_0RNSVGUseManager

ABI47_0_0RCT_EXPORT_MODULE()

- (ABI47_0_0RNSVGNode *)node
{
  return [ABI47_0_0RNSVGUse new];
}

ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(href, NSString)
ABI47_0_0RCT_CUSTOM_VIEW_PROPERTY(x, id, ABI47_0_0RNSVGUse)
{
  view.x = [ABI47_0_0RCTConvert ABI47_0_0RNSVGLength:json];
}
ABI47_0_0RCT_CUSTOM_VIEW_PROPERTY(y, id, ABI47_0_0RNSVGUse)
{
  view.y = [ABI47_0_0RCTConvert ABI47_0_0RNSVGLength:json];
}
ABI47_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI47_0_0RNSVGUse)
{
  view.useheight = [ABI47_0_0RCTConvert ABI47_0_0RNSVGLength:json];
}
ABI47_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI47_0_0RNSVGUse)
{
  view.usewidth = [ABI47_0_0RCTConvert ABI47_0_0RNSVGLength:json];
}

@end
