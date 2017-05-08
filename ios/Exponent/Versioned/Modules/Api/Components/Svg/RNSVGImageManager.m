/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RNSVGImageManager.h"
#import "RNSVGVBMOS.h"
#import "RNSVGImage.h"
#import "RCTConvert+RNSVG.h"

@implementation RNSVGImageManager

RCT_EXPORT_MODULE()

- (RNSVGRenderable *)node
{
    return [RNSVGImage new];
}

RCT_EXPORT_VIEW_PROPERTY(x, NSString)
RCT_EXPORT_VIEW_PROPERTY(y, NSString)
RCT_EXPORT_VIEW_PROPERTY(width, NSString)
RCT_EXPORT_VIEW_PROPERTY(height, NSString)
RCT_EXPORT_VIEW_PROPERTY(src, id)
RCT_EXPORT_VIEW_PROPERTY(align, NSString)
RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, RNSVGVBMOS)

@end
