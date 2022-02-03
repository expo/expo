/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI43_0_0RNSVGTextPathManager.h"

#import "ABI43_0_0RNSVGTextPath.h"

@implementation ABI43_0_0RNSVGTextPathManager

ABI43_0_0RCT_EXPORT_MODULE()

- (ABI43_0_0RNSVGRenderable *)node
{
  return [ABI43_0_0RNSVGTextPath new];
}

ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(href, NSString)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(side, NSString)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(method, NSString)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(midLine, NSString)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(spacing, NSString)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(startOffset, ABI43_0_0RNSVGLength*)

@end
