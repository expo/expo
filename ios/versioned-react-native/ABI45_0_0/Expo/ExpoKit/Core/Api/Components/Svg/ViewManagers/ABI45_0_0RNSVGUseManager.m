/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI45_0_0RNSVGUseManager.h"
#import "ABI45_0_0RNSVGUse.h"

@implementation ABI45_0_0RNSVGUseManager

ABI45_0_0RCT_EXPORT_MODULE()

- (ABI45_0_0RNSVGNode *)node
{
  return [ABI45_0_0RNSVGUse new];
}

ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(href, NSString)
ABI45_0_0RCT_CUSTOM_VIEW_PROPERTY(x, id, ABI45_0_0RNSVGUse)
{
    view.x = [ABI45_0_0RCTConvert ABI45_0_0RNSVGLength:json];
}
ABI45_0_0RCT_CUSTOM_VIEW_PROPERTY(y, id, ABI45_0_0RNSVGUse)
{
    view.y = [ABI45_0_0RCTConvert ABI45_0_0RNSVGLength:json];
}
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(useheight, ABI45_0_0RNSVGLength*)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(usewidth, ABI45_0_0RNSVGLength*)
ABI45_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI45_0_0RNSVGUse)
{
    view.useheight = [ABI45_0_0RCTConvert ABI45_0_0RNSVGLength:json];
}
ABI45_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI45_0_0RNSVGUse)
{
    view.usewidth = [ABI45_0_0RCTConvert ABI45_0_0RNSVGLength:json];
}

@end
