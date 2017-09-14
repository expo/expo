/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ReactABI21_0_0/ABI21_0_0RCTBridge.h>
#import <ReactABI21_0_0/ABI21_0_0RCTUIManager.h>
#import "ABI21_0_0RNSVGSvgViewManager.h"
#import "ABI21_0_0RNSVGSvgView.h"

@implementation ABI21_0_0RNSVGSvgViewManager

ABI21_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    return [ABI21_0_0RNSVGSvgView new];
}

ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(minX, CGFloat)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(minY, CGFloat)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(vbWidth, CGFloat)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(vbHeight, CGFloat)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI21_0_0RNSVGVBMOS)

ABI21_0_0RCT_EXPORT_METHOD(toDataURL:(nonnull NSNumber *)ReactABI21_0_0Tag callback:(ABI21_0_0RCTResponseSenderBlock)callback)
{
    [self.bridge.uiManager addUIBlock:^(ABI21_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *,UIView *> *viewRegistry) {
        __kindof UIView *view = viewRegistry[ReactABI21_0_0Tag];
        if ([view isKindOfClass:[ABI21_0_0RNSVGSvgView class]]) {
            ABI21_0_0RNSVGSvgView *svg = view;
            callback(@[[svg getDataURL]]);
        } else {
            ABI21_0_0RCTLogError(@"Invalid svg returned frin registry, expecting ABI21_0_0RNSVGSvgView, got: %@", view);
        }
    }];
}

@end
