/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ReactABI14_0_0/ABI14_0_0RCTBridge.h>
#import <ReactABI14_0_0/ABI14_0_0RCTUIManager.h>
#import "ABI14_0_0RNSVGSvgViewManager.h"
#import "ABI14_0_0RNSVGSvgView.h"

@implementation ABI14_0_0RNSVGSvgViewManager

ABI14_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    return [ABI14_0_0RNSVGSvgView new];
}


ABI14_0_0RCT_EXPORT_METHOD(toDataURL:(nonnull NSNumber *)ReactABI14_0_0Tag callback:(ABI14_0_0RCTResponseSenderBlock)callback)
{
    [self.bridge.uiManager addUIBlock:^(ABI14_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *,UIView *> *viewRegistry) {
        __kindof UIView *view = viewRegistry[ReactABI14_0_0Tag];
        if ([view isKindOfClass:[ABI14_0_0RNSVGSvgView class]]) {
            ABI14_0_0RNSVGSvgView *svg = view;
            callback(@[[svg getDataURL]]);
        } else {
            ABI14_0_0RCTLogError(@"Invalid svg returned frin registry, expecting ABI14_0_0RNSVGSvgView, got: %@", view);
        }
    }];
}

@end
