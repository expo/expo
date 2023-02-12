/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI46_0_0React/ABI46_0_0RCTBridge.h>
#import <ABI46_0_0React/ABI46_0_0RCTUIManager.h>
#import <ABI46_0_0React/ABI46_0_0RCTUIManagerUtils.h>
#import "ABI46_0_0RNSVGSvgViewManager.h"
#import "ABI46_0_0RNSVGSvgView.h"

@implementation ABI46_0_0RNSVGSvgViewManager

ABI46_0_0RCT_EXPORT_MODULE()

- (ABI46_0_0RNSVGView *)view
{
    return [ABI46_0_0RNSVGSvgView new];
}

ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(bbWidth, ABI46_0_0RNSVGLength*)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(bbHeight, ABI46_0_0RNSVGLength*)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(minX, CGFloat)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(minY, CGFloat)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(vbWidth, CGFloat)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(vbHeight, CGFloat)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI46_0_0RNSVGVBMOS)
ABI46_0_0RCT_CUSTOM_VIEW_PROPERTY(tintColor, id, ABI46_0_0RNSVGSvgView)
{
    view.tintColor = [ABI46_0_0RCTConvert UIColor:json];
}
ABI46_0_0RCT_CUSTOM_VIEW_PROPERTY(color, id, ABI46_0_0RNSVGSvgView)
{
    view.tintColor = [ABI46_0_0RCTConvert UIColor:json];
}


- (void)toDataURL:(nonnull NSNumber *)ABI46_0_0ReactTag options:(NSDictionary *)options callback:(ABI46_0_0RCTResponseSenderBlock)callback attempt:(int)attempt {
    [self.bridge.uiManager addUIBlock:^(ABI46_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *,ABI46_0_0RNSVGView *> *viewRegistry) {
        __kindof ABI46_0_0RNSVGView *view = viewRegistry[ABI46_0_0ReactTag];
        NSString * b64;
        if ([view isKindOfClass:[ABI46_0_0RNSVGSvgView class]]) {
            ABI46_0_0RNSVGSvgView *svg = view;
            if (options == nil) {
                b64 = [svg getDataURL];
            } else {
                id width = [options objectForKey:@"width"];
                id height = [options objectForKey:@"height"];
                if (![width isKindOfClass:NSNumber.class] ||
                    ![height isKindOfClass:NSNumber.class]) {
                    ABI46_0_0RCTLogError(@"Invalid width or height given to toDataURL");
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
            ABI46_0_0RCTLogError(@"Invalid svg returned frin registry, expecting ABI46_0_0RNSVGSvgView, got: %@", view);
            return;
        }
        if (b64) {
            callback(@[b64]);
        } else if (attempt < 1) {
            void (^retryBlock)(void) = ^{
                [self toDataURL:ABI46_0_0ReactTag options:options callback:callback attempt:(attempt + 1)];
            };

            ABI46_0_0RCTExecuteOnUIManagerQueue(retryBlock);
        } else {
            callback(@[]);
        }
    }];
}

ABI46_0_0RCT_EXPORT_METHOD(toDataURL:(nonnull NSNumber *)ABI46_0_0ReactTag options:(NSDictionary *)options callback:(ABI46_0_0RCTResponseSenderBlock)callback)
{
    [self toDataURL:ABI46_0_0ReactTag options:options callback:callback attempt:0];
}

@end
