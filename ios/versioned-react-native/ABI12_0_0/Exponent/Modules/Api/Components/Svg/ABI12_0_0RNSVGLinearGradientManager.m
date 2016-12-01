/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI12_0_0RNSVGLinearGradientManager.h"
#import "ABI12_0_0RNSVGLinearGradient.h"

@implementation ABI12_0_0RNSVGLinearGradientManager

ABI12_0_0RCT_EXPORT_MODULE()

- (ABI12_0_0RNSVGNode *)node
{
  return [ABI12_0_0RNSVGLinearGradient new];
}

ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(x1, NSString)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(y1, NSString)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(x2, NSString)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(y2, NSString)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(gradient, NSArray<NSNumber *>)

@end
