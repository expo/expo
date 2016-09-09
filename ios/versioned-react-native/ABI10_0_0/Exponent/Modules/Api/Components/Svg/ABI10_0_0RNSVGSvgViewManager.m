/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI10_0_0RCTBridge.h"
#import "ABI10_0_0RCTUIManager.h"
#import "ABI10_0_0RNSVGSvgViewManager.h"
#import "ABI10_0_0RNSVGSvgView.h"

@implementation ABI10_0_0RNSVGSvgViewManager

ABI10_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    return [ABI10_0_0RNSVGSvgView new];
}


ABI10_0_0RCT_EXPORT_METHOD(toDataURL:(nonnull NSNumber *)ReactABI10_0_0Tag callback:(ABI10_0_0RCTResponseSenderBlock)callback)
{
    [self.bridge.uiManager addUIBlock:^(ABI10_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *,UIView *> *viewRegistry) {
        __kindof UIView *view = viewRegistry[ReactABI10_0_0Tag];
        if ([view isKindOfClass:[ABI10_0_0RNSVGSvgView class]]) {
            ABI10_0_0RNSVGSvgView *svg = view;
            callback(@[[svg getDataURL]]);
        } else {
            ABI10_0_0RCTLogError(@"Invalid svg returned frin registry, expecting ABI10_0_0RNSVGSvgView, got: %@", view);
        }
    }];
}

@end
