/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RNSVGSvgViewModule.h"
#import <React/RCTBridge.h>
#import <React/RCTUIManager.h>
#import <React/RCTUIManagerUtils.h>
#import "RNSVGSvgView.h"

@implementation RNSVGSvgViewModule

RCT_EXPORT_MODULE()

#ifdef RCT_NEW_ARCH_ENABLED
@synthesize viewRegistry_DEPRECATED = _viewRegistry_DEPRECATED;
#endif // RCT_NEW_ARCH_ENABLED
@synthesize bridge = _bridge;

- (void)toDataURL:(nonnull NSNumber *)reactTag
          options:(NSDictionary *)options
         callback:(RCTResponseSenderBlock)callback
          attempt:(int)attempt
{
  void (^block)(void) = ^{
#ifdef RCT_NEW_ARCH_ENABLED
    [self.viewRegistry_DEPRECATED addUIBlock:^(RCTViewRegistry *viewRegistry) {
      __kindof RNSVGPlatformView *view = [viewRegistry viewForReactTag:reactTag];
#else
    [self.bridge.uiManager
        addUIBlock:^(RCTUIManager *uiManager, NSDictionary<NSNumber *, RNSVGPlatformView *> *viewRegistry) {
          __kindof RNSVGPlatformView *view = [uiManager viewForReactTag:reactTag];
#endif // RCT_NEW_ARCH_ENABLED
      NSString *b64;
      if ([view isKindOfClass:[RNSVGSvgView class]]) {
        RNSVGSvgView *svg = view;
        if (options == nil) {
          b64 = [svg getDataURL];
        } else {
          id width = [options objectForKey:@"width"];
          id height = [options objectForKey:@"height"];
          if (![width isKindOfClass:NSNumber.class] || ![height isKindOfClass:NSNumber.class]) {
            RCTLogError(@"Invalid width or height given to toDataURL");
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
        RCTLogError(@"Invalid svg returned from registry, expecting RNSVGSvgView, got: %@", view);
        return;
      }
      if (b64) {
        callback(@[ b64 ]);
      } else if (attempt < 1) {
        [self toDataURL:reactTag options:options callback:callback attempt:(attempt + 1)];
      } else {
        callback(@[]);
      }
    }];
  };
  if (self.bridge) {
    dispatch_async(RCTGetUIManagerQueue(), block);
  } else {
    dispatch_async(dispatch_get_main_queue(), block);
  }
}

RCT_EXPORT_METHOD(toDataURL
                  : (nonnull NSNumber *)reactTag options
                  : (NSDictionary *)options callback
                  : (RCTResponseSenderBlock)callback)
{
  [self toDataURL:reactTag options:options callback:callback attempt:0];
}

#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeSvgViewModuleSpecJSI>(params);
}
#endif

@end
