/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ReactABI33_0_0/ABI33_0_0RCTBridge.h>
#import <ReactABI33_0_0/ABI33_0_0RCTUIManager.h>
#import <ReactABI33_0_0/ABI33_0_0RCTUIManagerUtils.h>
#import "ABI33_0_0RNSVGSvgViewManager.h"
#import "ABI33_0_0RNSVGSvgView.h"

@implementation ABI33_0_0RNSVGSvgViewManager

ABI33_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    return [ABI33_0_0RNSVGSvgView new];
}

ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(bbWidth, ABI33_0_0RNSVGLength*)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(bbHeight, ABI33_0_0RNSVGLength*)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(minX, CGFloat)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(minY, CGFloat)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(vbWidth, CGFloat)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(vbHeight, CGFloat)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI33_0_0RNSVGVBMOS)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor)


- (void)toDataURL:(nonnull NSNumber *)ReactABI33_0_0Tag options:(NSDictionary *)options callback:(ABI33_0_0RCTResponseSenderBlock)callback attempt:(int)attempt {
    [self.bridge.uiManager addUIBlock:^(ABI33_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *,UIView *> *viewRegistry) {
        __kindof UIView *view = viewRegistry[ReactABI33_0_0Tag];
        NSString * b64;
        if ([view isKindOfClass:[ABI33_0_0RNSVGSvgView class]]) {
            ABI33_0_0RNSVGSvgView *svg = view;
            if (options == nil) {
                b64 = [svg getDataURL];
            } else {
                id width = [options objectForKey:@"width"];
                id height = [options objectForKey:@"height"];
                if (![width isKindOfClass:NSNumber.class] ||
                    ![height isKindOfClass:NSNumber.class]) {
                    ABI33_0_0RCTLogError(@"Invalid width or height given to toDataURL");
                    return;
                }
                NSNumber* w = width;
                NSInteger wi = (NSInteger)[w intValue];
                NSNumber* h = height;
                NSInteger hi = (NSInteger)[h intValue];

                CGRect bounds = CGRectMake(0, 0, wi, hi);
                b64 = [svg getDataURLwithBounds:bounds];
            }
        } else {
            ABI33_0_0RCTLogError(@"Invalid svg returned frin registry, expecting ABI33_0_0RNSVGSvgView, got: %@", view);
            return;
        }
        if (b64) {
            callback(@[b64]);
        } else if (attempt < 1) {
            void (^retryBlock)(void) = ^{
                [self toDataURL:ReactABI33_0_0Tag options:options callback:callback attempt:(attempt + 1)];
            };

            ABI33_0_0RCTExecuteOnUIManagerQueue(retryBlock);
        } else {
            callback(@[]);
        }
    }];
}

ABI33_0_0RCT_EXPORT_METHOD(toDataURL:(nonnull NSNumber *)ReactABI33_0_0Tag options:(NSDictionary *)options callback:(ABI33_0_0RCTResponseSenderBlock)callback)
{
    [self toDataURL:ReactABI33_0_0Tag options:options callback:callback attempt:0];
}

@end
