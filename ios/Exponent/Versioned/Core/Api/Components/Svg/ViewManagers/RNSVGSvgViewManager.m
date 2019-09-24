/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTBridge.h>
#import <React/RCTUIManager.h>
#import <React/RCTUIManagerUtils.h>
#import "RNSVGSvgViewManager.h"
#import "RNSVGSvgView.h"

@implementation RNSVGSvgViewManager

RCT_EXPORT_MODULE()

- (UIView *)view
{
    return [RNSVGSvgView new];
}

RCT_EXPORT_VIEW_PROPERTY(bbWidth, RNSVGLength*)
RCT_EXPORT_VIEW_PROPERTY(bbHeight, RNSVGLength*)
RCT_EXPORT_VIEW_PROPERTY(minX, CGFloat)
RCT_EXPORT_VIEW_PROPERTY(minY, CGFloat)
RCT_EXPORT_VIEW_PROPERTY(vbWidth, CGFloat)
RCT_EXPORT_VIEW_PROPERTY(vbHeight, CGFloat)
RCT_EXPORT_VIEW_PROPERTY(align, NSString)
RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, RNSVGVBMOS)
RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor)
RCT_CUSTOM_VIEW_PROPERTY(color, id, RNSVGSvgView)
{
    view.tintColor = [RCTConvert UIColor:json];
}


- (void)toDataURL:(nonnull NSNumber *)reactTag options:(NSDictionary *)options callback:(RCTResponseSenderBlock)callback attempt:(int)attempt {
    [self.bridge.uiManager addUIBlock:^(RCTUIManager *uiManager, NSDictionary<NSNumber *,UIView *> *viewRegistry) {
        __kindof UIView *view = viewRegistry[reactTag];
        NSString * b64;
        if ([view isKindOfClass:[RNSVGSvgView class]]) {
            RNSVGSvgView *svg = view;
            if (options == nil) {
                b64 = [svg getDataURL];
            } else {
                id width = [options objectForKey:@"width"];
                id height = [options objectForKey:@"height"];
                if (![width isKindOfClass:NSNumber.class] ||
                    ![height isKindOfClass:NSNumber.class]) {
                    RCTLogError(@"Invalid width or height given to toDataURL");
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
            RCTLogError(@"Invalid svg returned frin registry, expecting RNSVGSvgView, got: %@", view);
            return;
        }
        if (b64) {
            callback(@[b64]);
        } else if (attempt < 1) {
            void (^retryBlock)(void) = ^{
                [self toDataURL:reactTag options:options callback:callback attempt:(attempt + 1)];
            };

            RCTExecuteOnUIManagerQueue(retryBlock);
        } else {
            callback(@[]);
        }
    }];
}

RCT_EXPORT_METHOD(toDataURL:(nonnull NSNumber *)reactTag options:(NSDictionary *)options callback:(RCTResponseSenderBlock)callback)
{
    [self toDataURL:reactTag options:options callback:callback attempt:0];
}

@end
