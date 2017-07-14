/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI19_0_0RNSVGTextManager.h"

#import "ABI19_0_0RNSVGText.h"
#import "ABI19_0_0RCTConvert+RNSVG.h"

@implementation ABI19_0_0RNSVGTextManager

ABI19_0_0RCT_EXPORT_MODULE()

- (ABI19_0_0RNSVGRenderable *)node
{
  return [ABI19_0_0RNSVGText new];
}

ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(textAnchor, ABI19_0_0RNSVGTextAnchor)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(deltaX, NSArray<NSNumber *>)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(deltaY, NSArray<NSNumber *>)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(positionX, NSString)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(positionY, NSString)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(font, NSDictionary)

@end
