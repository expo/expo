/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI41_0_0RNSVGUseManager.h"
#import "ABI41_0_0RNSVGUse.h"

@implementation ABI41_0_0RNSVGUseManager

ABI41_0_0RCT_EXPORT_MODULE()

- (ABI41_0_0RNSVGNode *)node
{
  return [ABI41_0_0RNSVGUse new];
}

ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(href, NSString)
ABI41_0_0RCT_CUSTOM_VIEW_PROPERTY(x, id, ABI41_0_0RNSVGUse)
{
    view.x = [ABI41_0_0RCTConvert ABI41_0_0RNSVGLength:json];
}
ABI41_0_0RCT_CUSTOM_VIEW_PROPERTY(y, id, ABI41_0_0RNSVGUse)
{
    view.y = [ABI41_0_0RCTConvert ABI41_0_0RNSVGLength:json];
}
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(useheight, ABI41_0_0RNSVGLength*)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(usewidth, ABI41_0_0RNSVGLength*)
ABI41_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI41_0_0RNSVGUse)
{
    view.useheight = [ABI41_0_0RCTConvert ABI41_0_0RNSVGLength:json];
}
ABI41_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI41_0_0RNSVGUse)
{
    view.usewidth = [ABI41_0_0RCTConvert ABI41_0_0RNSVGLength:json];
}

@end
