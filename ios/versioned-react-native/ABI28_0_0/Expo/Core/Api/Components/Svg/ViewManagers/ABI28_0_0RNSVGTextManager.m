/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI28_0_0RNSVGTextManager.h"

#import "ABI28_0_0RNSVGText.h"
#import "ABI28_0_0RCTConvert+RNSVG.h"

@implementation ABI28_0_0RNSVGTextManager

ABI28_0_0RCT_EXPORT_MODULE()

- (ABI28_0_0RNSVGRenderable *)node
{
  return [ABI28_0_0RNSVGText new];
}

ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(textAnchor, ABI28_0_0RNSVGTextAnchor)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(deltaX, NSArray<NSString *>)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(deltaY, NSArray<NSString *>)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(positionX, NSArray<NSString *>)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(positionY, NSArray<NSString *>)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(rotate, NSArray<NSString *>)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(font, NSDictionary)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(textLength, NSString)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(baselineShift, NSString)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(lengthAdjust, NSString)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(alignmentBaseline, NSString)

@end
