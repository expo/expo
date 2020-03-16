/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI37_0_0RNSVGUseManager.h"
#import "ABI37_0_0RNSVGUse.h"

@implementation ABI37_0_0RNSVGUseManager

ABI37_0_0RCT_EXPORT_MODULE()

- (ABI37_0_0RNSVGNode *)node
{
  return [ABI37_0_0RNSVGUse new];
}

ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(href, NSString)
ABI37_0_0RCT_CUSTOM_VIEW_PROPERTY(x, id, ABI37_0_0RNSVGUse)
{
    view.x = [ABI37_0_0RCTConvert ABI37_0_0RNSVGLength:json];
}
ABI37_0_0RCT_CUSTOM_VIEW_PROPERTY(y, id, ABI37_0_0RNSVGUse)
{
    view.y = [ABI37_0_0RCTConvert ABI37_0_0RNSVGLength:json];
}
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(useheight, ABI37_0_0RNSVGLength*)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(usewidth, ABI37_0_0RNSVGLength*)
ABI37_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI37_0_0RNSVGUse)
{
    view.useheight = [ABI37_0_0RCTConvert ABI37_0_0RNSVGLength:json];
}
ABI37_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI37_0_0RNSVGUse)
{
    view.usewidth = [ABI37_0_0RCTConvert ABI37_0_0RNSVGLength:json];
}

@end
