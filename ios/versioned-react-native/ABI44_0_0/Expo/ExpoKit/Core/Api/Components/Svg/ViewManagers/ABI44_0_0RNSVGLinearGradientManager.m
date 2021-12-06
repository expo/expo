/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI44_0_0RNSVGLinearGradientManager.h"
#import "ABI44_0_0RNSVGLinearGradient.h"

@implementation ABI44_0_0RNSVGLinearGradientManager

ABI44_0_0RCT_EXPORT_MODULE()

- (ABI44_0_0RNSVGNode *)node
{
  return [ABI44_0_0RNSVGLinearGradient new];
}

ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(x1, ABI44_0_0RNSVGLength*)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(y1, ABI44_0_0RNSVGLength*)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(x2, ABI44_0_0RNSVGLength*)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(y2, ABI44_0_0RNSVGLength*)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(gradient, NSArray<NSNumber *>)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(gradientUnits, ABI44_0_0RNSVGUnits)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(gradientTransform, CGAffineTransform)

@end
