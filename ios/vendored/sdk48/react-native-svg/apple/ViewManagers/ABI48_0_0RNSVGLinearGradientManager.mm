/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI48_0_0RNSVGLinearGradientManager.h"
#import "ABI48_0_0RNSVGLinearGradient.h"

@implementation ABI48_0_0RNSVGLinearGradientManager

ABI48_0_0RCT_EXPORT_MODULE()

- (ABI48_0_0RNSVGNode *)node
{
  return [ABI48_0_0RNSVGLinearGradient new];
}

ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(x1, ABI48_0_0RNSVGLength *)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(y1, ABI48_0_0RNSVGLength *)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(x2, ABI48_0_0RNSVGLength *)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(y2, ABI48_0_0RNSVGLength *)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(gradient, NSArray<NSNumber *>)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(gradientUnits, ABI48_0_0RNSVGUnits)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(gradientTransform, CGAffineTransform)

@end
