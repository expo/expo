/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI37_0_0RNSVGImageManager.h"
#import "ABI37_0_0RNSVGVBMOS.h"
#import "ABI37_0_0RNSVGImage.h"
#import "ABI37_0_0RCTConvert+RNSVG.h"

@implementation ABI37_0_0RNSVGImageManager

ABI37_0_0RCT_EXPORT_MODULE()

- (ABI37_0_0RNSVGRenderable *)node
{
    ABI37_0_0RNSVGImage *svgImage = [ABI37_0_0RNSVGImage new];
    svgImage.bridge = self.bridge;

    return svgImage;
}

ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(x, ABI37_0_0RNSVGLength*)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(y, ABI37_0_0RNSVGLength*)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(imagewidth, ABI37_0_0RNSVGLength*)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(imageheight, ABI37_0_0RNSVGLength*)
ABI37_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI37_0_0RNSVGImage)
{
    view.imagewidth = [ABI37_0_0RCTConvert ABI37_0_0RNSVGLength:json];
}
ABI37_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI37_0_0RNSVGImage)
{
    view.imageheight = [ABI37_0_0RCTConvert ABI37_0_0RNSVGLength:json];
}
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(src, id)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI37_0_0RNSVGVBMOS)

@end
