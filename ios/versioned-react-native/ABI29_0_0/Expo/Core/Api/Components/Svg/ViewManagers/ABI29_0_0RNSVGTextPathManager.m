/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI29_0_0RNSVGTextPathManager.h"

#import "ABI29_0_0RNSVGTextPath.h"

@implementation ABI29_0_0RNSVGTextPathManager

ABI29_0_0RCT_EXPORT_MODULE()

- (ABI29_0_0RNSVGRenderable *)node
{
  return [ABI29_0_0RNSVGTextPath new];
}

ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(href, NSString)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(side, NSString)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(method, NSString)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(midLine, NSString)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(spacing, NSString)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(startOffset, NSString)

@end
