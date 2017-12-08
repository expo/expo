/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ReactABI24_0_0/ABI24_0_0RCTBridge.h>
#import <ReactABI24_0_0/ABI24_0_0RCTUIManager.h>
#import "ABI24_0_0RNSVGSvgViewManager.h"
#import "ABI24_0_0RNSVGSvgView.h"

@implementation ABI24_0_0RNSVGSvgViewManager

ABI24_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    return [ABI24_0_0RNSVGSvgView new];
}

ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(minX, CGFloat)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(minY, CGFloat)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(vbWidth, CGFloat)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(vbHeight, CGFloat)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI24_0_0RNSVGVBMOS)

ABI24_0_0RCT_EXPORT_METHOD(toDataURL:(nonnull NSNumber *)ReactABI24_0_0Tag callback:(ABI24_0_0RCTResponseSenderBlock)callback)
{
    [self.bridge.uiManager addUIBlock:^(ABI24_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *,UIView *> *viewRegistry) {
        __kindof UIView *view = viewRegistry[ReactABI24_0_0Tag];
        if ([view isKindOfClass:[ABI24_0_0RNSVGSvgView class]]) {
            ABI24_0_0RNSVGSvgView *svg = view;
            callback(@[[svg getDataURL]]);
        } else {
            ABI24_0_0RCTLogError(@"Invalid svg returned frin registry, expecting ABI24_0_0RNSVGSvgView, got: %@", view);
        }
    }];
}

@end
