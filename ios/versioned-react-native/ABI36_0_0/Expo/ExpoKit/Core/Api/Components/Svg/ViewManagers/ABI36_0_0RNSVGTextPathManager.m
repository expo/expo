/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI36_0_0RNSVGTextPathManager.h"

#import "ABI36_0_0RNSVGTextPath.h"

@implementation ABI36_0_0RNSVGTextPathManager

ABI36_0_0RCT_EXPORT_MODULE()

- (ABI36_0_0RNSVGRenderable *)node
{
  return [ABI36_0_0RNSVGTextPath new];
}

ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(href, NSString)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(side, NSString)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(method, NSString)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(midLine, NSString)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(spacing, NSString)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(startOffset, ABI36_0_0RNSVGLength*)

@end
