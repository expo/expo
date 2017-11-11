/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI23_0_0RNSVGImageManager.h"
#import "ABI23_0_0RNSVGVBMOS.h"
#import "ABI23_0_0RNSVGImage.h"
#import "ABI23_0_0RCTConvert+RNSVG.h"

@implementation ABI23_0_0RNSVGImageManager

ABI23_0_0RCT_EXPORT_MODULE()

- (ABI23_0_0RNSVGRenderable *)node
{
    return [ABI23_0_0RNSVGImage new];
}

ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(x, NSString)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(y, NSString)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(width, NSString)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(height, NSString)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(src, id)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI23_0_0RNSVGVBMOS)

@end
