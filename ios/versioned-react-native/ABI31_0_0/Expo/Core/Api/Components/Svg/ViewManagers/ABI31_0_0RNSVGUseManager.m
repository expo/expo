/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI31_0_0RNSVGUseManager.h"
#import "ABI31_0_0RNSVGUse.h"

@implementation ABI31_0_0RNSVGUseManager

ABI31_0_0RCT_EXPORT_MODULE()

- (ABI31_0_0RNSVGNode *)node
{
  return [ABI31_0_0RNSVGUse new];
}

ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(href, NSString)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(useheight, ABI31_0_0RNSVGLength*)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(usewidth, ABI31_0_0RNSVGLength*)
ABI31_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI31_0_0RNSVGUse)
{
    view.useheight = [ABI31_0_0RCTConvert ABI31_0_0RNSVGLength:json];
}
ABI31_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI31_0_0RNSVGUse)
{
    view.usewidth = [ABI31_0_0RCTConvert ABI31_0_0RNSVGLength:json];
}

@end
