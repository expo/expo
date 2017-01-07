/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI13_0_0RNSVGImageManager.h"

#import "ABI13_0_0RNSVGImage.h"
#import "ABI13_0_0RCTConvert+RNSVG.h"

@implementation ABI13_0_0RNSVGImageManager

ABI13_0_0RCT_EXPORT_MODULE()

- (ABI13_0_0RNSVGRenderable *)node
{
    return [ABI13_0_0RNSVGImage new];
}

ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(x, NSString)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(y, NSString)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(width, NSString)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(height, NSString)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(src, id)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI13_0_0RNSVGVBMOS)

@end
