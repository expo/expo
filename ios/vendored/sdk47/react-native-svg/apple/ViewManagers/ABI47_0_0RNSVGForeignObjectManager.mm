/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI47_0_0RNSVGForeignObjectManager.h"
#import "ABI47_0_0RNSVGForeignObject.h"

@implementation ABI47_0_0RNSVGForeignObjectManager

ABI47_0_0RCT_EXPORT_MODULE()

- (ABI47_0_0RNSVGForeignObject *)node
{
  return [ABI47_0_0RNSVGForeignObject new];
}

ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(x, ABI47_0_0RNSVGLength *)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(y, ABI47_0_0RNSVGLength *)
ABI47_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI47_0_0RNSVGForeignObject)
{
  view.foreignObjectheight = [ABI47_0_0RCTConvert ABI47_0_0RNSVGLength:json];
}
ABI47_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI47_0_0RNSVGForeignObject)
{
  view.foreignObjectwidth = [ABI47_0_0RCTConvert ABI47_0_0RNSVGLength:json];
}

@end
