/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI39_0_0RNSVGLinearGradientManager.h"
#import "ABI39_0_0RNSVGLinearGradient.h"

@implementation ABI39_0_0RNSVGLinearGradientManager

ABI39_0_0RCT_EXPORT_MODULE()

- (ABI39_0_0RNSVGNode *)node
{
  return [ABI39_0_0RNSVGLinearGradient new];
}

ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(x1, ABI39_0_0RNSVGLength*)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(y1, ABI39_0_0RNSVGLength*)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(x2, ABI39_0_0RNSVGLength*)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(y2, ABI39_0_0RNSVGLength*)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(gradient, NSArray<NSNumber *>)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(gradientUnits, ABI39_0_0RNSVGUnits)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(gradientTransform, CGAffineTransform)

@end
