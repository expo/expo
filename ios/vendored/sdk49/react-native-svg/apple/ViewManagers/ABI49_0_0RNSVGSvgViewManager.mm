/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI49_0_0RNSVGSvgViewManager.h"
#import "ABI49_0_0RNSVGSvgView.h"

@implementation ABI49_0_0RNSVGSvgViewManager

ABI49_0_0RCT_EXPORT_MODULE()

- (ABI49_0_0RNSVGView *)view
{
  return [ABI49_0_0RNSVGSvgView new];
}

ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(bbWidth, ABI49_0_0RNSVGLength *)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(bbHeight, ABI49_0_0RNSVGLength *)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(minX, CGFloat)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(minY, CGFloat)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(vbWidth, CGFloat)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(vbHeight, CGFloat)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI49_0_0RNSVGVBMOS)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor)
ABI49_0_0RCT_REMAP_VIEW_PROPERTY(color, tintColor, UIColor)

@end
