/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI23_0_0RNSVGTextManager.h"

#import "ABI23_0_0RNSVGText.h"
#import "ABI23_0_0RCTConvert+RNSVG.h"

@implementation ABI23_0_0RNSVGTextManager

ABI23_0_0RCT_EXPORT_MODULE()

- (ABI23_0_0RNSVGRenderable *)node
{
  return [ABI23_0_0RNSVGText new];
}

ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(textAnchor, ABI23_0_0RNSVGTextAnchor)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(deltaX, NSArray<NSNumber *>)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(deltaY, NSArray<NSNumber *>)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(positionX, NSString)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(positionY, NSString)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(font, NSDictionary)

@end
