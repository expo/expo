/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI49_0_0RNSVGSvgViewModule.h"
#import <ABI49_0_0React/ABI49_0_0RCTBridge.h>
#import <ABI49_0_0React/ABI49_0_0RCTUIManager.h>
#import <ABI49_0_0React/ABI49_0_0RCTUIManagerUtils.h>
#import "ABI49_0_0RNSVGSvgView.h"

@implementation ABI49_0_0RNSVGSvgViewModule

ABI49_0_0RCT_EXPORT_MODULE()

#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
@synthesize viewRegistry_DEPRECATED = _viewRegistry_DEPRECATED;
#endif // ABI49_0_0RCT_NEW_ARCH_ENABLED
@synthesize bridge = _bridge;

- (void)toDataURL:(nonnull NSNumber *)ABI49_0_0ReactTag
          options:(NSDictionary *)options
         callback:(ABI49_0_0RCTResponseSenderBlock)callback
          attempt:(int)attempt
{
  void (^block)(void) = ^{
#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
    [self.viewRegistry_DEPRECATED addUIBlock:^(ABI49_0_0RCTViewRegistry *viewRegistry) {
      __kindof ABI49_0_0RNSVGPlatformView *view = [viewRegistry viewForABI49_0_0ReactTag:ABI49_0_0ReactTag];
#else
    [self.bridge.uiManager
        addUIBlock:^(ABI49_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI49_0_0RNSVGPlatformView *> *viewRegistry) {
          __kindof ABI49_0_0RNSVGPlatformView *view = [uiManager viewForABI49_0_0ReactTag:ABI49_0_0ReactTag];
#endif // ABI49_0_0RCT_NEW_ARCH_ENABLED
      NSString *b64;
      if ([view isKindOfClass:[ABI49_0_0RNSVGSvgView class]]) {
        ABI49_0_0RNSVGSvgView *svg = view;
        if (options == nil) {
          b64 = [svg getDataURL];
        } else {
          id width = [options objectForKey:@"width"];
          id height = [options objectForKey:@"height"];
          if (![width isKindOfClass:NSNumber.class] || ![height isKindOfClass:NSNumber.class]) {
            ABI49_0_0RCTLogError(@"Invalid width or height given to toDataURL");
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
        ABI49_0_0RCTLogError(@"Invalid svg returned from registry, expecting ABI49_0_0RNSVGSvgView, got: %@", view);
        return;
      }
      if (b64) {
        callback(@[ b64 ]);
      } else if (attempt < 1) {
        [self toDataURL:ABI49_0_0ReactTag options:options callback:callback attempt:(attempt + 1)];
      } else {
        callback(@[]);
      }
    }];
  };
  if (self.bridge) {
    dispatch_async(ABI49_0_0RCTGetUIManagerQueue(), block);
  } else {
    dispatch_async(dispatch_get_main_queue(), block);
  }
}

ABI49_0_0RCT_EXPORT_METHOD(toDataURL
                  : (nonnull NSNumber *)ABI49_0_0ReactTag options
                  : (NSDictionary *)options callback
                  : (ABI49_0_0RCTResponseSenderBlock)callback)
{
  [self toDataURL:ABI49_0_0ReactTag options:options callback:callback attempt:0];
}

#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<ABI49_0_0facebook::ABI49_0_0React::TurboModule>)getTurboModule:
    (const ABI49_0_0facebook::ABI49_0_0React::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<ABI49_0_0facebook::ABI49_0_0React::NativeSvgViewModuleSpecJSI>(params);
}
#endif

@end
