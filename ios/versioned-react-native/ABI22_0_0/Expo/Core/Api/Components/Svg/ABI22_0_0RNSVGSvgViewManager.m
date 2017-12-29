/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ReactABI22_0_0/ABI22_0_0RCTBridge.h>
#import <ReactABI22_0_0/ABI22_0_0RCTUIManager.h>
#import "ABI22_0_0RNSVGSvgViewManager.h"
#import "ABI22_0_0RNSVGSvgView.h"

@implementation ABI22_0_0RNSVGSvgViewManager

ABI22_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    return [ABI22_0_0RNSVGSvgView new];
}

ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(minX, CGFloat)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(minY, CGFloat)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(vbWidth, CGFloat)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(vbHeight, CGFloat)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI22_0_0RNSVGVBMOS)

ABI22_0_0RCT_EXPORT_METHOD(toDataURL:(nonnull NSNumber *)ReactABI22_0_0Tag callback:(ABI22_0_0RCTResponseSenderBlock)callback)
{
    [self.bridge.uiManager addUIBlock:^(ABI22_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *,UIView *> *viewRegistry) {
        __kindof UIView *view = viewRegistry[ReactABI22_0_0Tag];
        if ([view isKindOfClass:[ABI22_0_0RNSVGSvgView class]]) {
            ABI22_0_0RNSVGSvgView *svg = view;
            callback(@[[svg getDataURL]]);
        } else {
            ABI22_0_0RCTLogError(@"Invalid svg returned frin registry, expecting ABI22_0_0RNSVGSvgView, got: %@", view);
        }
    }];
}

@end
