/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI12_0_0RCTBridge.h"
#import "ABI12_0_0RCTUIManager.h"
#import "ABI12_0_0RNSVGSvgViewManager.h"
#import "ABI12_0_0RNSVGSvgView.h"

@implementation ABI12_0_0RNSVGSvgViewManager

ABI12_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    return [ABI12_0_0RNSVGSvgView new];
}


ABI12_0_0RCT_EXPORT_METHOD(toDataURL:(nonnull NSNumber *)ReactABI12_0_0Tag callback:(ABI12_0_0RCTResponseSenderBlock)callback)
{
    [self.bridge.uiManager addUIBlock:^(ABI12_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *,UIView *> *viewRegistry) {
        __kindof UIView *view = viewRegistry[ReactABI12_0_0Tag];
        if ([view isKindOfClass:[ABI12_0_0RNSVGSvgView class]]) {
            ABI12_0_0RNSVGSvgView *svg = view;
            callback(@[[svg getDataURL]]);
        } else {
            ABI12_0_0RCTLogError(@"Invalid svg returned frin registry, expecting ABI12_0_0RNSVGSvgView, got: %@", view);
        }
    }];
}

@end
