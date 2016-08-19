/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI9_0_0RNSVGRadialGradientManager.h"
#import "ABI9_0_0RNSVGRadialGradient.h"

@implementation ABI9_0_0RNSVGRadialGradientManager

ABI9_0_0RCT_EXPORT_MODULE()

- (ABI9_0_0RNSVGNode *)node
{
  return [ABI9_0_0RNSVGRadialGradient new];
}

ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(fx, NSString)
ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(fy, NSString)
ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(rx, NSString)
ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(ry, NSString)
ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(cx, NSString)
ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(cy, NSString)
ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(gradient, NSArray<NSNumber *>)

@end
