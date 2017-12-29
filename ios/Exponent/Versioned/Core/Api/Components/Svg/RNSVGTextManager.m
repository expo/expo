/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RNSVGTextManager.h"

#import "RNSVGText.h"
#import "RCTConvert+RNSVG.h"

@implementation RNSVGTextManager

RCT_EXPORT_MODULE()

- (RNSVGRenderable *)node
{
  return [RNSVGText new];
}

RCT_EXPORT_VIEW_PROPERTY(textAnchor, RNSVGTextAnchor)
RCT_EXPORT_VIEW_PROPERTY(deltaX, NSArray<NSNumber *>)
RCT_EXPORT_VIEW_PROPERTY(deltaY, NSArray<NSNumber *>)
RCT_EXPORT_VIEW_PROPERTY(positionX, NSString)
RCT_EXPORT_VIEW_PROPERTY(positionY, NSString)
RCT_EXPORT_VIEW_PROPERTY(font, NSDictionary)

@end
