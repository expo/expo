/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI10_0_0RNSVGImageManager.h"

#import "ABI10_0_0RNSVGImage.h"
#import "ABI10_0_0RCTConvert+RNSVG.h"

@implementation ABI10_0_0RNSVGImageManager

ABI10_0_0RCT_EXPORT_MODULE()

- (ABI10_0_0RNSVGRenderable *)node
{
    return [ABI10_0_0RNSVGImage new];
}

ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(x, NSString)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(y, NSString)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(width, NSString)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(height, NSString)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(src, id)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI10_0_0RNSVGVBMOS)

@end
