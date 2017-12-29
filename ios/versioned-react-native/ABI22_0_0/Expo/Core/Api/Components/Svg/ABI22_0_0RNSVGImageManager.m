/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI22_0_0RNSVGImageManager.h"
#import "ABI22_0_0RNSVGVBMOS.h"
#import "ABI22_0_0RNSVGImage.h"
#import "ABI22_0_0RCTConvert+RNSVG.h"

@implementation ABI22_0_0RNSVGImageManager

ABI22_0_0RCT_EXPORT_MODULE()

- (ABI22_0_0RNSVGRenderable *)node
{
    return [ABI22_0_0RNSVGImage new];
}

ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(x, NSString)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(y, NSString)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(width, NSString)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(height, NSString)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(src, id)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI22_0_0RNSVGVBMOS)

@end
