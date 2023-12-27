/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI44_0_0RNSVGImageManager.h"
#import "ABI44_0_0RNSVGVBMOS.h"
#import "ABI44_0_0RNSVGImage.h"
#import "ABI44_0_0RCTConvert+RNSVG.h"

@implementation ABI44_0_0RNSVGImageManager

ABI44_0_0RCT_EXPORT_MODULE()

- (ABI44_0_0RNSVGRenderable *)node
{
    ABI44_0_0RNSVGImage *svgImage = [ABI44_0_0RNSVGImage new];
    svgImage.bridge = self.bridge;

    return svgImage;
}

ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(x, ABI44_0_0RNSVGLength*)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(y, ABI44_0_0RNSVGLength*)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(imagewidth, ABI44_0_0RNSVGLength*)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(imageheight, ABI44_0_0RNSVGLength*)
ABI44_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI44_0_0RNSVGImage)
{
    view.imagewidth = [ABI44_0_0RCTConvert ABI44_0_0RNSVGLength:json];
}
ABI44_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI44_0_0RNSVGImage)
{
    view.imageheight = [ABI44_0_0RCTConvert ABI44_0_0RNSVGLength:json];
}
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(src, id)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI44_0_0RNSVGVBMOS)

@end
