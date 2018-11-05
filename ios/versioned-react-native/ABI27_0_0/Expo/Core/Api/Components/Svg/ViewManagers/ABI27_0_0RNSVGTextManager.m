/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI27_0_0RNSVGTextManager.h"

#import "ABI27_0_0RNSVGText.h"
#import "ABI27_0_0RCTConvert+RNSVG.h"

@implementation ABI27_0_0RNSVGTextManager

ABI27_0_0RCT_EXPORT_MODULE()

- (ABI27_0_0RNSVGRenderable *)node
{
  return [ABI27_0_0RNSVGText new];
}

ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(textAnchor, ABI27_0_0RNSVGTextAnchor)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(deltaX, NSArray<NSString *>)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(deltaY, NSArray<NSString *>)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(positionX, NSArray<NSString *>)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(positionY, NSArray<NSString *>)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(rotate, NSArray<NSString *>)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(font, NSDictionary)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(textLength, NSString)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(baselineShift, NSString)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(lengthAdjust, NSString)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(alignmentBaseline, NSString)

@end
