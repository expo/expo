/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ReactABI31_0_0/ABI31_0_0RCTBridge.h>
#import <ReactABI31_0_0/ABI31_0_0RCTUIManager.h>
#import "ABI31_0_0RNSVGSvgViewManager.h"
#import "ABI31_0_0RNSVGSvgView.h"

@implementation ABI31_0_0RNSVGSvgViewManager

ABI31_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    return [ABI31_0_0RNSVGSvgView new];
}

ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(bbWidth, NSString)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(bbHeight, NSString)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(minX, CGFloat)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(minY, CGFloat)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(vbWidth, CGFloat)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(vbHeight, CGFloat)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI31_0_0RNSVGVBMOS)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor)

ABI31_0_0RCT_EXPORT_METHOD(toDataURL:(nonnull NSNumber *)ReactABI31_0_0Tag callback:(ABI31_0_0RCTResponseSenderBlock)callback)
{
    [self.bridge.uiManager addUIBlock:^(ABI31_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *,UIView *> *viewRegistry) {
        __kindof UIView *view = viewRegistry[ReactABI31_0_0Tag];
        if ([view isKindOfClass:[ABI31_0_0RNSVGSvgView class]]) {
            ABI31_0_0RNSVGSvgView *svg = view;
            callback(@[[svg getDataURL]]);
        } else {
            ABI31_0_0RCTLogError(@"Invalid svg returned frin registry, expecting ABI31_0_0RNSVGSvgView, got: %@", view);
        }
    }];
}

@end
