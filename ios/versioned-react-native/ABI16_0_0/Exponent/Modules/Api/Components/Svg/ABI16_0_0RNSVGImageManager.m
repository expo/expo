/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI16_0_0RNSVGImageManager.h"

#import "ABI16_0_0RNSVGImage.h"
#import "ABI16_0_0RCTConvert+RNSVG.h"

@implementation ABI16_0_0RNSVGImageManager

ABI16_0_0RCT_EXPORT_MODULE()

- (ABI16_0_0RNSVGRenderable *)node
{
    return [ABI16_0_0RNSVGImage new];
}

ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(x, NSString)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(y, NSString)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(width, NSString)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(height, NSString)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(src, id)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI16_0_0RNSVGVBMOS)

@end
