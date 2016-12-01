/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI12_0_0RNSVGImageManager.h"

#import "ABI12_0_0RNSVGImage.h"
#import "ABI12_0_0RCTConvert+RNSVG.h"

@implementation ABI12_0_0RNSVGImageManager

ABI12_0_0RCT_EXPORT_MODULE()

- (ABI12_0_0RNSVGRenderable *)node
{
    return [ABI12_0_0RNSVGImage new];
}

ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(x, NSString)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(y, NSString)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(width, NSString)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(height, NSString)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(src, id)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI12_0_0RNSVGVBMOS)

@end
