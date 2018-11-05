/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ReactABI28_0_0/ABI28_0_0RCTBridge.h>
#import <ReactABI28_0_0/ABI28_0_0RCTUIManager.h>
#import "ABI28_0_0RNSVGSvgViewManager.h"
#import "ABI28_0_0RNSVGSvgView.h"

@implementation ABI28_0_0RNSVGSvgViewManager

ABI28_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    return [ABI28_0_0RNSVGSvgView new];
}

ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(minX, CGFloat)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(minY, CGFloat)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(vbWidth, CGFloat)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(vbHeight, CGFloat)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI28_0_0RNSVGVBMOS)

ABI28_0_0RCT_EXPORT_METHOD(toDataURL:(nonnull NSNumber *)ReactABI28_0_0Tag callback:(ABI28_0_0RCTResponseSenderBlock)callback)
{
    [self.bridge.uiManager addUIBlock:^(ABI28_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *,UIView *> *viewRegistry) {
        __kindof UIView *view = viewRegistry[ReactABI28_0_0Tag];
        if ([view isKindOfClass:[ABI28_0_0RNSVGSvgView class]]) {
            ABI28_0_0RNSVGSvgView *svg = view;
            callback(@[[svg getDataURL]]);
        } else {
            ABI28_0_0RCTLogError(@"Invalid svg returned frin registry, expecting ABI28_0_0RNSVGSvgView, got: %@", view);
        }
    }];
}

@end
