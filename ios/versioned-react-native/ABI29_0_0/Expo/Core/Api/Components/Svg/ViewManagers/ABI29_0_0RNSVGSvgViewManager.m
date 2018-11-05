/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ReactABI29_0_0/ABI29_0_0RCTBridge.h>
#import <ReactABI29_0_0/ABI29_0_0RCTUIManager.h>
#import "ABI29_0_0RNSVGSvgViewManager.h"
#import "ABI29_0_0RNSVGSvgView.h"

@implementation ABI29_0_0RNSVGSvgViewManager

ABI29_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    return [ABI29_0_0RNSVGSvgView new];
}

ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(minX, CGFloat)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(minY, CGFloat)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(vbWidth, CGFloat)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(vbHeight, CGFloat)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI29_0_0RNSVGVBMOS)

ABI29_0_0RCT_EXPORT_METHOD(toDataURL:(nonnull NSNumber *)ReactABI29_0_0Tag callback:(ABI29_0_0RCTResponseSenderBlock)callback)
{
    [self.bridge.uiManager addUIBlock:^(ABI29_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *,UIView *> *viewRegistry) {
        __kindof UIView *view = viewRegistry[ReactABI29_0_0Tag];
        if ([view isKindOfClass:[ABI29_0_0RNSVGSvgView class]]) {
            ABI29_0_0RNSVGSvgView *svg = view;
            callback(@[[svg getDataURL]]);
        } else {
            ABI29_0_0RCTLogError(@"Invalid svg returned frin registry, expecting ABI29_0_0RNSVGSvgView, got: %@", view);
        }
    }];
}

@end
