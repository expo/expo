/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI14_0_0RNSVGImageManager.h"

#import "ABI14_0_0RNSVGImage.h"
#import "ABI14_0_0RCTConvert+RNSVG.h"

@implementation ABI14_0_0RNSVGImageManager

ABI14_0_0RCT_EXPORT_MODULE()

- (ABI14_0_0RNSVGRenderable *)node
{
    return [ABI14_0_0RNSVGImage new];
}

ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(x, NSString)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(y, NSString)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(width, NSString)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(height, NSString)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(src, id)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI14_0_0RNSVGVBMOS)

@end
