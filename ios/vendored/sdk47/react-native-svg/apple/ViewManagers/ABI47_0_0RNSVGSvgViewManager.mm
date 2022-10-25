/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI47_0_0RNSVGSvgViewManager.h"
#import <ABI47_0_0React/ABI47_0_0RCTBridge.h>
#import <ABI47_0_0React/ABI47_0_0RCTUIManager.h>
#import <ABI47_0_0React/ABI47_0_0RCTUIManagerUtils.h>
#import "ABI47_0_0RNSVGSvgView.h"

@implementation ABI47_0_0RNSVGSvgViewManager

ABI47_0_0RCT_EXPORT_MODULE()

- (ABI47_0_0RNSVGView *)view
{
  return [ABI47_0_0RNSVGSvgView new];
}

ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(bbWidth, ABI47_0_0RNSVGLength *)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(bbHeight, ABI47_0_0RNSVGLength *)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(minX, CGFloat)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(minY, CGFloat)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(vbWidth, CGFloat)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(vbHeight, CGFloat)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI47_0_0RNSVGVBMOS)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor)
ABI47_0_0RCT_REMAP_VIEW_PROPERTY(color, tintColor, UIColor)

- (void)toDataURL:(nonnull NSNumber *)ABI47_0_0ReactTag
          options:(NSDictionary *)options
         callback:(ABI47_0_0RCTResponseSenderBlock)callback
          attempt:(int)attempt
{
  [self.bridge.uiManager
      addUIBlock:^(ABI47_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI47_0_0RNSVGPlatformView *> *viewRegistry) {
        __kindof ABI47_0_0RNSVGPlatformView *view = [uiManager viewForABI47_0_0ReactTag:ABI47_0_0ReactTag];
        NSString *b64;
        if ([view isKindOfClass:[ABI47_0_0RNSVGSvgView class]]) {
          ABI47_0_0RNSVGSvgView *svg = view;
          if (options == nil) {
            b64 = [svg getDataURL];
          } else {
            id width = [options objectForKey:@"width"];
            id height = [options objectForKey:@"height"];
            if (![width isKindOfClass:NSNumber.class] || ![height isKindOfClass:NSNumber.class]) {
              ABI47_0_0RCTLogError(@"Invalid width or height given to toDataURL");
              return;
            }
            NSNumber *w = width;
            NSInteger wi = (NSInteger)[w intValue];
            NSNumber *h = height;
            NSInteger hi = (NSInteger)[h intValue];

            CGRect bounds = CGRectMake(0, 0, wi, hi);
            b64 = [svg getDataURLwithBounds:bounds];
          }
        } else {
          ABI47_0_0RCTLogError(@"Invalid svg returned from registry, expecting ABI47_0_0RNSVGSvgView, got: %@", view);
          return;
        }
        if (b64) {
          callback(@[ b64 ]);
        } else if (attempt < 1) {
          void (^retryBlock)(void) = ^{
            [self toDataURL:ABI47_0_0ReactTag options:options callback:callback attempt:(attempt + 1)];
          };

          ABI47_0_0RCTExecuteOnUIManagerQueue(retryBlock);
        } else {
          callback(@[]);
        }
      }];
}

ABI47_0_0RCT_EXPORT_METHOD(toDataURL
                  : (nonnull NSNumber *)ABI47_0_0ReactTag options
                  : (NSDictionary *)options callback
                  : (ABI47_0_0RCTResponseSenderBlock)callback)
{
  [self toDataURL:ABI47_0_0ReactTag options:options callback:callback attempt:0];
}

@end
