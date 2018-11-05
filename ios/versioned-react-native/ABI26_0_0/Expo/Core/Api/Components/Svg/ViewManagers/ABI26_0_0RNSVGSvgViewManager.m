/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ReactABI26_0_0/ABI26_0_0RCTBridge.h>
#import <ReactABI26_0_0/ABI26_0_0RCTUIManager.h>
#import "ABI26_0_0RNSVGSvgViewManager.h"
#import "ABI26_0_0RNSVGSvgView.h"

@implementation ABI26_0_0RNSVGSvgViewManager

ABI26_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    return [ABI26_0_0RNSVGSvgView new];
}

ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(minX, CGFloat)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(minY, CGFloat)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(vbWidth, CGFloat)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(vbHeight, CGFloat)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI26_0_0RNSVGVBMOS)

ABI26_0_0RCT_EXPORT_METHOD(toDataURL:(nonnull NSNumber *)ReactABI26_0_0Tag callback:(ABI26_0_0RCTResponseSenderBlock)callback)
{
    [self.bridge.uiManager addUIBlock:^(ABI26_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *,UIView *> *viewRegistry) {
        __kindof UIView *view = viewRegistry[ReactABI26_0_0Tag];
        if ([view isKindOfClass:[ABI26_0_0RNSVGSvgView class]]) {
            ABI26_0_0RNSVGSvgView *svg = view;
            callback(@[[svg getDataURL]]);
        } else {
            ABI26_0_0RCTLogError(@"Invalid svg returned frin registry, expecting ABI26_0_0RNSVGSvgView, got: %@", view);
        }
    }];
}

@end
