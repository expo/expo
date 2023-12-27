/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI43_0_0RNSVGImageManager.h"
#import "ABI43_0_0RNSVGVBMOS.h"
#import "ABI43_0_0RNSVGImage.h"
#import "ABI43_0_0RCTConvert+RNSVG.h"

@implementation ABI43_0_0RNSVGImageManager

ABI43_0_0RCT_EXPORT_MODULE()

- (ABI43_0_0RNSVGRenderable *)node
{
    ABI43_0_0RNSVGImage *svgImage = [ABI43_0_0RNSVGImage new];
    svgImage.bridge = self.bridge;

    return svgImage;
}

ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(x, ABI43_0_0RNSVGLength*)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(y, ABI43_0_0RNSVGLength*)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(imagewidth, ABI43_0_0RNSVGLength*)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(imageheight, ABI43_0_0RNSVGLength*)
ABI43_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI43_0_0RNSVGImage)
{
    view.imagewidth = [ABI43_0_0RCTConvert ABI43_0_0RNSVGLength:json];
}
ABI43_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI43_0_0RNSVGImage)
{
    view.imageheight = [ABI43_0_0RCTConvert ABI43_0_0RNSVGLength:json];
}
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(src, id)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI43_0_0RNSVGVBMOS)

@end
