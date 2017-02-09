/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI14_0_0RNSVGRadialGradientManager.h"
#import "ABI14_0_0RNSVGRadialGradient.h"

@implementation ABI14_0_0RNSVGRadialGradientManager

ABI14_0_0RCT_EXPORT_MODULE()

- (ABI14_0_0RNSVGNode *)node
{
  return [ABI14_0_0RNSVGRadialGradient new];
}

ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(fx, NSString)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(fy, NSString)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(rx, NSString)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(ry, NSString)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(cx, NSString)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(cy, NSString)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(gradient, NSArray<NSNumber *>)

@end
