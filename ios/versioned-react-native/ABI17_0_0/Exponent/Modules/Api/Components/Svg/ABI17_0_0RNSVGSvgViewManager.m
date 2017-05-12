/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ReactABI17_0_0/ABI17_0_0RCTBridge.h>
#import <ReactABI17_0_0/ABI17_0_0RCTUIManager.h>
#import "ABI17_0_0RNSVGSvgViewManager.h"
#import "ABI17_0_0RNSVGSvgView.h"

@implementation ABI17_0_0RNSVGSvgViewManager

ABI17_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    return [ABI17_0_0RNSVGSvgView new];
}

ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(minX, CGFloat)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(minY, CGFloat)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(vbWidth, CGFloat)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(vbHeight, CGFloat)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI17_0_0RNSVGVBMOS)

ABI17_0_0RCT_EXPORT_METHOD(toDataURL:(nonnull NSNumber *)ReactABI17_0_0Tag callback:(ABI17_0_0RCTResponseSenderBlock)callback)
{
    [self.bridge.uiManager addUIBlock:^(ABI17_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *,UIView *> *viewRegistry) {
        __kindof UIView *view = viewRegistry[ReactABI17_0_0Tag];
        if ([view isKindOfClass:[ABI17_0_0RNSVGSvgView class]]) {
            ABI17_0_0RNSVGSvgView *svg = view;
            callback(@[[svg getDataURL]]);
        } else {
            ABI17_0_0RCTLogError(@"Invalid svg returned frin registry, expecting ABI17_0_0RNSVGSvgView, got: %@", view);
        }
    }];
}

@end
