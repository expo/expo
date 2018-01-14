/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ReactABI25_0_0/ABI25_0_0RCTBridge.h>
#import <ReactABI25_0_0/ABI25_0_0RCTUIManager.h>
#import "ABI25_0_0RNSVGSvgViewManager.h"
#import "ABI25_0_0RNSVGSvgView.h"

@implementation ABI25_0_0RNSVGSvgViewManager

ABI25_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    return [ABI25_0_0RNSVGSvgView new];
}

ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(minX, CGFloat)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(minY, CGFloat)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(vbWidth, CGFloat)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(vbHeight, CGFloat)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI25_0_0RNSVGVBMOS)

ABI25_0_0RCT_EXPORT_METHOD(toDataURL:(nonnull NSNumber *)ReactABI25_0_0Tag callback:(ABI25_0_0RCTResponseSenderBlock)callback)
{
    [self.bridge.uiManager addUIBlock:^(ABI25_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *,UIView *> *viewRegistry) {
        __kindof UIView *view = viewRegistry[ReactABI25_0_0Tag];
        if ([view isKindOfClass:[ABI25_0_0RNSVGSvgView class]]) {
            ABI25_0_0RNSVGSvgView *svg = view;
            callback(@[[svg getDataURL]]);
        } else {
            ABI25_0_0RCTLogError(@"Invalid svg returned frin registry, expecting ABI25_0_0RNSVGSvgView, got: %@", view);
        }
    }];
}

@end
