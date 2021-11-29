/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "DevLauncherRNSVGImageManager.h"
#import "DevLauncherRNSVGVBMOS.h"
#import "DevLauncherRNSVGImage.h"
#import "RCTConvert+DevLauncherRNSVG.h"

@implementation DevLauncherRNSVGImageManager

- (DevLauncherRNSVGRenderable *)node
{
    DevLauncherRNSVGImage *svgImage = [DevLauncherRNSVGImage new];
    svgImage.bridge = self.bridge;

    return svgImage;
}

RCT_EXPORT_VIEW_PROPERTY(x, DevLauncherRNSVGLength*)
RCT_EXPORT_VIEW_PROPERTY(y, DevLauncherRNSVGLength*)
RCT_EXPORT_VIEW_PROPERTY(imagewidth, DevLauncherRNSVGLength*)
RCT_EXPORT_VIEW_PROPERTY(imageheight, DevLauncherRNSVGLength*)
RCT_CUSTOM_VIEW_PROPERTY(width, id, DevLauncherRNSVGImage)
{
    view.imagewidth = [RCTConvert DevLauncherRNSVGLength:json];
}
RCT_CUSTOM_VIEW_PROPERTY(height, id, DevLauncherRNSVGImage)
{
    view.imageheight = [RCTConvert DevLauncherRNSVGLength:json];
}
RCT_EXPORT_VIEW_PROPERTY(src, id)
RCT_EXPORT_VIEW_PROPERTY(align, NSString)
RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, DevLauncherRNSVGVBMOS)

@end
