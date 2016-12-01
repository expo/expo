/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI12_0_0RNSVGRectManager.h"

#import "ABI12_0_0RNSVGRect.h"
#import "ABI12_0_0RCTConvert+RNSVG.h"

@implementation ABI12_0_0RNSVGRectManager

ABI12_0_0RCT_EXPORT_MODULE()

- (ABI12_0_0RNSVGRenderable *)node
{
  return [ABI12_0_0RNSVGRect new];
}

ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(x, NSString)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(y, NSString)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(width, NSString)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(height, NSString)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(rx, NSString)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(ry, NSString)

@end
