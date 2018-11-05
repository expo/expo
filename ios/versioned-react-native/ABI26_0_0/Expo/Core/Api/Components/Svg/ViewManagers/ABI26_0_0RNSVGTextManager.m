/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI26_0_0RNSVGTextManager.h"

#import "ABI26_0_0RNSVGText.h"
#import "ABI26_0_0RCTConvert+RNSVG.h"

@implementation ABI26_0_0RNSVGTextManager

ABI26_0_0RCT_EXPORT_MODULE()

- (ABI26_0_0RNSVGRenderable *)node
{
  return [ABI26_0_0RNSVGText new];
}

ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(textAnchor, ABI26_0_0RNSVGTextAnchor)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(deltaX, NSArray<NSString *>)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(deltaY, NSArray<NSString *>)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(positionX, NSArray<NSString *>)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(positionY, NSArray<NSString *>)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(rotate, NSArray<NSString *>)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(font, NSDictionary)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(textLength, NSString)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(baselineShift, NSString)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(lengthAdjust, NSString)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(alignmentBaseline, NSString)

@end
