/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ReactABI32_0_0/ABI32_0_0RCTBridge.h>
#import <ReactABI32_0_0/ABI32_0_0RCTUIManager.h>
#import "ABI32_0_0RNSVGSvgViewManager.h"
#import "ABI32_0_0RNSVGSvgView.h"

@implementation ABI32_0_0RNSVGSvgViewManager

ABI32_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    return [ABI32_0_0RNSVGSvgView new];
}

ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(bbWidth, NSString)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(bbHeight, NSString)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(minX, CGFloat)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(minY, CGFloat)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(vbWidth, CGFloat)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(vbHeight, CGFloat)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI32_0_0RNSVGVBMOS)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor)

ABI32_0_0RCT_EXPORT_METHOD(toDataURL:(nonnull NSNumber *)ReactABI32_0_0Tag callback:(ABI32_0_0RCTResponseSenderBlock)callback)
{
    [self.bridge.uiManager addUIBlock:^(ABI32_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *,UIView *> *viewRegistry) {
        __kindof UIView *view = viewRegistry[ReactABI32_0_0Tag];
        if ([view isKindOfClass:[ABI32_0_0RNSVGSvgView class]]) {
            ABI32_0_0RNSVGSvgView *svg = view;
            callback(@[[svg getDataURL]]);
        } else {
            ABI32_0_0RCTLogError(@"Invalid svg returned frin registry, expecting ABI32_0_0RNSVGSvgView, got: %@", view);
        }
    }];
}

@end
