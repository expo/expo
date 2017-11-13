/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ReactABI23_0_0/ABI23_0_0RCTBridge.h>
#import <ReactABI23_0_0/ABI23_0_0RCTUIManager.h>
#import "ABI23_0_0RNSVGSvgViewManager.h"
#import "ABI23_0_0RNSVGSvgView.h"

@implementation ABI23_0_0RNSVGSvgViewManager

ABI23_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    return [ABI23_0_0RNSVGSvgView new];
}

ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(minX, CGFloat)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(minY, CGFloat)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(vbWidth, CGFloat)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(vbHeight, CGFloat)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI23_0_0RNSVGVBMOS)

ABI23_0_0RCT_EXPORT_METHOD(toDataURL:(nonnull NSNumber *)ReactABI23_0_0Tag callback:(ABI23_0_0RCTResponseSenderBlock)callback)
{
    [self.bridge.uiManager addUIBlock:^(ABI23_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *,UIView *> *viewRegistry) {
        __kindof UIView *view = viewRegistry[ReactABI23_0_0Tag];
        if ([view isKindOfClass:[ABI23_0_0RNSVGSvgView class]]) {
            ABI23_0_0RNSVGSvgView *svg = view;
            callback(@[[svg getDataURL]]);
        } else {
            ABI23_0_0RCTLogError(@"Invalid svg returned frin registry, expecting ABI23_0_0RNSVGSvgView, got: %@", view);
        }
    }];
}

@end
