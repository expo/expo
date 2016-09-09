/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI10_0_0RNSVGRadialGradientManager.h"
#import "ABI10_0_0RNSVGRadialGradient.h"

@implementation ABI10_0_0RNSVGRadialGradientManager

ABI10_0_0RCT_EXPORT_MODULE()

- (ABI10_0_0RNSVGNode *)node
{
  return [ABI10_0_0RNSVGRadialGradient new];
}

ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(fx, NSString)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(fy, NSString)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(rx, NSString)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(ry, NSString)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(cx, NSString)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(cy, NSString)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(gradient, NSArray<NSNumber *>)

@end
