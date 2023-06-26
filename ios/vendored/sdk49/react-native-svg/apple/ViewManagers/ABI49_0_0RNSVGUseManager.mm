/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI49_0_0RNSVGUseManager.h"
#import "ABI49_0_0RNSVGUse.h"

@implementation ABI49_0_0RNSVGUseManager

ABI49_0_0RCT_EXPORT_MODULE()

- (ABI49_0_0RNSVGNode *)node
{
  return [ABI49_0_0RNSVGUse new];
}

ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(href, NSString)
ABI49_0_0RCT_CUSTOM_VIEW_PROPERTY(x, id, ABI49_0_0RNSVGUse)
{
  view.x = [ABI49_0_0RCTConvert ABI49_0_0RNSVGLength:json];
}
ABI49_0_0RCT_CUSTOM_VIEW_PROPERTY(y, id, ABI49_0_0RNSVGUse)
{
  view.y = [ABI49_0_0RCTConvert ABI49_0_0RNSVGLength:json];
}
ABI49_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI49_0_0RNSVGUse)
{
  view.useheight = [ABI49_0_0RCTConvert ABI49_0_0RNSVGLength:json];
}
ABI49_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI49_0_0RNSVGUse)
{
  view.usewidth = [ABI49_0_0RCTConvert ABI49_0_0RNSVGLength:json];
}

@end
