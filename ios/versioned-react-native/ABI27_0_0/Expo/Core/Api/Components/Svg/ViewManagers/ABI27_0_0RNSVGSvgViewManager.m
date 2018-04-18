/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ReactABI27_0_0/ABI27_0_0RCTBridge.h>
#import <ReactABI27_0_0/ABI27_0_0RCTUIManager.h>
#import "ABI27_0_0RNSVGSvgViewManager.h"
#import "ABI27_0_0RNSVGSvgView.h"

@implementation ABI27_0_0RNSVGSvgViewManager

ABI27_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    return [ABI27_0_0RNSVGSvgView new];
}

ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(minX, CGFloat)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(minY, CGFloat)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(vbWidth, CGFloat)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(vbHeight, CGFloat)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI27_0_0RNSVGVBMOS)

ABI27_0_0RCT_EXPORT_METHOD(toDataURL:(nonnull NSNumber *)ReactABI27_0_0Tag callback:(ABI27_0_0RCTResponseSenderBlock)callback)
{
    [self.bridge.uiManager addUIBlock:^(ABI27_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *,UIView *> *viewRegistry) {
        __kindof UIView *view = viewRegistry[ReactABI27_0_0Tag];
        if ([view isKindOfClass:[ABI27_0_0RNSVGSvgView class]]) {
            ABI27_0_0RNSVGSvgView *svg = view;
            callback(@[[svg getDataURL]]);
        } else {
            ABI27_0_0RCTLogError(@"Invalid svg returned frin registry, expecting ABI27_0_0RNSVGSvgView, got: %@", view);
        }
    }];
}

@end
