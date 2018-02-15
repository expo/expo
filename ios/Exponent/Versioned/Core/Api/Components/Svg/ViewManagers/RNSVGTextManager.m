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
RCT_EXPORT_VIEW_PROPERTY(deltaX, NSArray<NSString *>)
RCT_EXPORT_VIEW_PROPERTY(deltaY, NSArray<NSString *>)
RCT_EXPORT_VIEW_PROPERTY(positionX, NSArray<NSString *>)
RCT_EXPORT_VIEW_PROPERTY(positionY, NSArray<NSString *>)
RCT_EXPORT_VIEW_PROPERTY(rotate, NSArray<NSString *>)
RCT_EXPORT_VIEW_PROPERTY(font, NSDictionary)
RCT_EXPORT_VIEW_PROPERTY(textLength, NSString)
RCT_EXPORT_VIEW_PROPERTY(baselineShift, NSString)
RCT_EXPORT_VIEW_PROPERTY(lengthAdjust, NSString)
RCT_EXPORT_VIEW_PROPERTY(alignmentBaseline, NSString)

@end
