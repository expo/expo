/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ReactABI30_0_0/ABI30_0_0RCTBridge.h>
#import <ReactABI30_0_0/ABI30_0_0RCTUIManager.h>
#import "ABI30_0_0RNSVGSvgViewManager.h"
#import "ABI30_0_0RNSVGSvgView.h"

@implementation ABI30_0_0RNSVGSvgViewManager

ABI30_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    return [ABI30_0_0RNSVGSvgView new];
}

ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(minX, CGFloat)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(minY, CGFloat)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(vbWidth, CGFloat)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(vbHeight, CGFloat)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI30_0_0RNSVGVBMOS)

ABI30_0_0RCT_EXPORT_METHOD(toDataURL:(nonnull NSNumber *)ReactABI30_0_0Tag callback:(ABI30_0_0RCTResponseSenderBlock)callback)
{
    [self.bridge.uiManager addUIBlock:^(ABI30_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *,UIView *> *viewRegistry) {
        __kindof UIView *view = viewRegistry[ReactABI30_0_0Tag];
        if ([view isKindOfClass:[ABI30_0_0RNSVGSvgView class]]) {
            ABI30_0_0RNSVGSvgView *svg = view;
            callback(@[[svg getDataURL]]);
        } else {
            ABI30_0_0RCTLogError(@"Invalid svg returned frin registry, expecting ABI30_0_0RNSVGSvgView, got: %@", view);
        }
    }];
}

@end
