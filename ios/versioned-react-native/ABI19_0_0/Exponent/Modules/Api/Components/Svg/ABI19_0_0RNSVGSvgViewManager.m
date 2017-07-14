/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ReactABI19_0_0/ABI19_0_0RCTBridge.h>
#import <ReactABI19_0_0/ABI19_0_0RCTUIManager.h>
#import "ABI19_0_0RNSVGSvgViewManager.h"
#import "ABI19_0_0RNSVGSvgView.h"

@implementation ABI19_0_0RNSVGSvgViewManager

ABI19_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    return [ABI19_0_0RNSVGSvgView new];
}

ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(minX, CGFloat)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(minY, CGFloat)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(vbWidth, CGFloat)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(vbHeight, CGFloat)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI19_0_0RNSVGVBMOS)

ABI19_0_0RCT_EXPORT_METHOD(toDataURL:(nonnull NSNumber *)ReactABI19_0_0Tag callback:(ABI19_0_0RCTResponseSenderBlock)callback)
{
    [self.bridge.uiManager addUIBlock:^(ABI19_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *,UIView *> *viewRegistry) {
        __kindof UIView *view = viewRegistry[ReactABI19_0_0Tag];
        if ([view isKindOfClass:[ABI19_0_0RNSVGSvgView class]]) {
            ABI19_0_0RNSVGSvgView *svg = view;
            callback(@[[svg getDataURL]]);
        } else {
            ABI19_0_0RCTLogError(@"Invalid svg returned frin registry, expecting ABI19_0_0RNSVGSvgView, got: %@", view);
        }
    }];
}

@end
