/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI43_0_0RNSVGUseManager.h"
#import "ABI43_0_0RNSVGUse.h"

@implementation ABI43_0_0RNSVGUseManager

ABI43_0_0RCT_EXPORT_MODULE()

- (ABI43_0_0RNSVGNode *)node
{
  return [ABI43_0_0RNSVGUse new];
}

ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(href, NSString)
ABI43_0_0RCT_CUSTOM_VIEW_PROPERTY(x, id, ABI43_0_0RNSVGUse)
{
    view.x = [ABI43_0_0RCTConvert ABI43_0_0RNSVGLength:json];
}
ABI43_0_0RCT_CUSTOM_VIEW_PROPERTY(y, id, ABI43_0_0RNSVGUse)
{
    view.y = [ABI43_0_0RCTConvert ABI43_0_0RNSVGLength:json];
}
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(useheight, ABI43_0_0RNSVGLength*)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(usewidth, ABI43_0_0RNSVGLength*)
ABI43_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI43_0_0RNSVGUse)
{
    view.useheight = [ABI43_0_0RCTConvert ABI43_0_0RNSVGLength:json];
}
ABI43_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI43_0_0RNSVGUse)
{
    view.usewidth = [ABI43_0_0RCTConvert ABI43_0_0RNSVGLength:json];
}

@end
