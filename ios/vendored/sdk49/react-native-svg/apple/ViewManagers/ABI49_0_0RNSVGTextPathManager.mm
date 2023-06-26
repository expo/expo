/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI49_0_0RNSVGTextPathManager.h"

#import "ABI49_0_0RNSVGTextPath.h"

@implementation ABI49_0_0RNSVGTextPathManager

ABI49_0_0RCT_EXPORT_MODULE()

- (ABI49_0_0RNSVGRenderable *)node
{
  return [ABI49_0_0RNSVGTextPath new];
}

ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(href, NSString)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(side, NSString)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(method, NSString)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(midLine, NSString)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(spacing, NSString)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(startOffset, ABI49_0_0RNSVGLength *)

@end
