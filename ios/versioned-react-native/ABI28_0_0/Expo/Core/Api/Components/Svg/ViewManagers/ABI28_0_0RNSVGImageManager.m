/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI28_0_0RNSVGImageManager.h"
#import "ABI28_0_0RNSVGVBMOS.h"
#import "ABI28_0_0RNSVGImage.h"
#import "ABI28_0_0RCTConvert+RNSVG.h"

@implementation ABI28_0_0RNSVGImageManager

ABI28_0_0RCT_EXPORT_MODULE()

- (ABI28_0_0RNSVGRenderable *)node
{
    return [ABI28_0_0RNSVGImage new];
}

ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(x, NSString)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(y, NSString)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(width, NSString)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(height, NSString)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(src, id)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI28_0_0RNSVGVBMOS)

@end
