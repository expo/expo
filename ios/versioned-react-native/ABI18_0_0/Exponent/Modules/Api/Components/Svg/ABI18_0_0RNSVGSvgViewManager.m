/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ReactABI18_0_0/ABI18_0_0RCTBridge.h>
#import <ReactABI18_0_0/ABI18_0_0RCTUIManager.h>
#import "ABI18_0_0RNSVGSvgViewManager.h"
#import "ABI18_0_0RNSVGSvgView.h"

@implementation ABI18_0_0RNSVGSvgViewManager

ABI18_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    return [ABI18_0_0RNSVGSvgView new];
}

ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(minX, CGFloat)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(minY, CGFloat)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(vbWidth, CGFloat)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(vbHeight, CGFloat)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI18_0_0RNSVGVBMOS)

ABI18_0_0RCT_EXPORT_METHOD(toDataURL:(nonnull NSNumber *)ReactABI18_0_0Tag callback:(ABI18_0_0RCTResponseSenderBlock)callback)
{
    [self.bridge.uiManager addUIBlock:^(ABI18_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *,UIView *> *viewRegistry) {
        __kindof UIView *view = viewRegistry[ReactABI18_0_0Tag];
        if ([view isKindOfClass:[ABI18_0_0RNSVGSvgView class]]) {
            ABI18_0_0RNSVGSvgView *svg = view;
            callback(@[[svg getDataURL]]);
        } else {
            ABI18_0_0RCTLogError(@"Invalid svg returned frin registry, expecting ABI18_0_0RNSVGSvgView, got: %@", view);
        }
    }];
}

@end
