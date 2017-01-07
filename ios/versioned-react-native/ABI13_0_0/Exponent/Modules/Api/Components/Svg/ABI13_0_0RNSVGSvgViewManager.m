/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ReactABI13_0_0/ABI13_0_0RCTBridge.h>
#import <ReactABI13_0_0/ABI13_0_0RCTUIManager.h>
#import "ABI13_0_0RNSVGSvgViewManager.h"
#import "ABI13_0_0RNSVGSvgView.h"

@implementation ABI13_0_0RNSVGSvgViewManager

ABI13_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    return [ABI13_0_0RNSVGSvgView new];
}


ABI13_0_0RCT_EXPORT_METHOD(toDataURL:(nonnull NSNumber *)ReactABI13_0_0Tag callback:(ABI13_0_0RCTResponseSenderBlock)callback)
{
    [self.bridge.uiManager addUIBlock:^(ABI13_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *,UIView *> *viewRegistry) {
        __kindof UIView *view = viewRegistry[ReactABI13_0_0Tag];
        if ([view isKindOfClass:[ABI13_0_0RNSVGSvgView class]]) {
            ABI13_0_0RNSVGSvgView *svg = view;
            callback(@[[svg getDataURL]]);
        } else {
            ABI13_0_0RCTLogError(@"Invalid svg returned frin registry, expecting ABI13_0_0RNSVGSvgView, got: %@", view);
        }
    }];
}

@end
