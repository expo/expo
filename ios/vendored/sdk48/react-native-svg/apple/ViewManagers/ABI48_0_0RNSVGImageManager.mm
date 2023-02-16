/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI48_0_0RNSVGImageManager.h"
#import "ABI48_0_0RCTConvert+RNSVG.h"
#import "ABI48_0_0RNSVGImage.h"
#import "ABI48_0_0RNSVGVBMOS.h"

@implementation ABI48_0_0RNSVGImageManager

ABI48_0_0RCT_EXPORT_MODULE()

- (ABI48_0_0RNSVGRenderable *)node
{
  ABI48_0_0RNSVGImage *svgImage = [ABI48_0_0RNSVGImage new];
  svgImage.bridge = self.bridge;

  return svgImage;
}

ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(x, ABI48_0_0RNSVGLength *)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(y, ABI48_0_0RNSVGLength *)
ABI48_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI48_0_0RNSVGImage)
{
  view.imagewidth = [ABI48_0_0RCTConvert ABI48_0_0RNSVGLength:json];
}
ABI48_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI48_0_0RNSVGImage)
{
  view.imageheight = [ABI48_0_0RCTConvert ABI48_0_0RNSVGLength:json];
}
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(src, ABI48_0_0RCTImageSource)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI48_0_0RNSVGVBMOS)

@end
