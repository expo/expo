/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI35_0_0RNSVGUseManager.h"
#import "ABI35_0_0RNSVGUse.h"

@implementation ABI35_0_0RNSVGUseManager

ABI35_0_0RCT_EXPORT_MODULE()

- (ABI35_0_0RNSVGNode *)node
{
  return [ABI35_0_0RNSVGUse new];
}

ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(href, NSString)
ABI35_0_0RCT_CUSTOM_VIEW_PROPERTY(x, id, ABI35_0_0RNSVGUse)
{
    view.x = [ABI35_0_0RCTConvert ABI35_0_0RNSVGLength:json];
}
ABI35_0_0RCT_CUSTOM_VIEW_PROPERTY(y, id, ABI35_0_0RNSVGUse)
{
    view.y = [ABI35_0_0RCTConvert ABI35_0_0RNSVGLength:json];
}
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(useheight, ABI35_0_0RNSVGLength*)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(usewidth, ABI35_0_0RNSVGLength*)
ABI35_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI35_0_0RNSVGUse)
{
    view.useheight = [ABI35_0_0RCTConvert ABI35_0_0RNSVGLength:json];
}
ABI35_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI35_0_0RNSVGUse)
{
    view.usewidth = [ABI35_0_0RCTConvert ABI35_0_0RNSVGLength:json];
}

@end
