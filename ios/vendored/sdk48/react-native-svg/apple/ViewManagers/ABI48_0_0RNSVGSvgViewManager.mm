/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI48_0_0RNSVGSvgViewManager.h"
#import <ABI48_0_0React/ABI48_0_0RCTBridge.h>
#import <ABI48_0_0React/ABI48_0_0RCTUIManager.h>
#import <ABI48_0_0React/ABI48_0_0RCTUIManagerUtils.h>
#import "ABI48_0_0RNSVGSvgView.h"

@implementation ABI48_0_0RNSVGSvgViewManager

ABI48_0_0RCT_EXPORT_MODULE()

- (ABI48_0_0RNSVGView *)view
{
  return [ABI48_0_0RNSVGSvgView new];
}

ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(bbWidth, ABI48_0_0RNSVGLength *)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(bbHeight, ABI48_0_0RNSVGLength *)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(minX, CGFloat)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(minY, CGFloat)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(vbWidth, CGFloat)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(vbHeight, CGFloat)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI48_0_0RNSVGVBMOS)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor)
ABI48_0_0RCT_REMAP_VIEW_PROPERTY(color, tintColor, UIColor)

- (void)toDataURL:(nonnull NSNumber *)ABI48_0_0ReactTag
          options:(NSDictionary *)options
         callback:(ABI48_0_0RCTResponseSenderBlock)callback
          attempt:(int)attempt
{
  [self.bridge.uiManager
      addUIBlock:^(ABI48_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI48_0_0RNSVGPlatformView *> *viewRegistry) {
        __kindof ABI48_0_0RNSVGPlatformView *view = [uiManager viewForABI48_0_0ReactTag:ABI48_0_0ReactTag];
        NSString *b64;
        if ([view isKindOfClass:[ABI48_0_0RNSVGSvgView class]]) {
          ABI48_0_0RNSVGSvgView *svg = view;
          if (options == nil) {
            b64 = [svg getDataURL];
          } else {
            id width = [options objectForKey:@"width"];
            id height = [options objectForKey:@"height"];
            if (![width isKindOfClass:NSNumber.class] || ![height isKindOfClass:NSNumber.class]) {
              ABI48_0_0RCTLogError(@"Invalid width or height given to toDataURL");
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
          ABI48_0_0RCTLogError(@"Invalid svg returned from registry, expecting ABI48_0_0RNSVGSvgView, got: %@", view);
          return;
        }
        if (b64) {
          callback(@[ b64 ]);
        } else if (attempt < 1) {
          void (^retryBlock)(void) = ^{
            [self toDataURL:ABI48_0_0ReactTag options:options callback:callback attempt:(attempt + 1)];
          };

          ABI48_0_0RCTExecuteOnUIManagerQueue(retryBlock);
        } else {
          callback(@[]);
        }
      }];
}

ABI48_0_0RCT_EXPORT_METHOD(toDataURL
                  : (nonnull NSNumber *)ABI48_0_0ReactTag options
                  : (NSDictionary *)options callback
                  : (ABI48_0_0RCTResponseSenderBlock)callback)
{
  [self toDataURL:ABI48_0_0ReactTag options:options callback:callback attempt:0];
}

@end
