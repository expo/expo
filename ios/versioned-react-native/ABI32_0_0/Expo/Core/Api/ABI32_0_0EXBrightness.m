#import "ABI32_0_0EXBrightness.h"
#import "ABI32_0_0EXUtil.h"

#import <UIKit/UIKit.h>

@implementation ABI32_0_0EXBrightness

ABI32_0_0RCT_EXPORT_MODULE(ExponentBrightness);


ABI32_0_0RCT_EXPORT_METHOD(setBrightnessAsync:
                  (float)brightnessValue
                  resolver:(ABI32_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(ABI32_0_0RCTPromiseRejectBlock)reject)
{
  [ABI32_0_0EXUtil performSynchronouslyOnMainThread:^{
    [UIScreen mainScreen].brightness = brightnessValue;
  }];
  resolve(nil);
}

ABI32_0_0RCT_REMAP_METHOD(getBrightnessAsync,
                 resolver:(ABI32_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI32_0_0RCTPromiseRejectBlock)reject)
{
  __block float result = 0;
  [ABI32_0_0EXUtil performSynchronouslyOnMainThread:^{
    result = [UIScreen mainScreen].brightness;
  }];
  resolve(@(result));
}

@end
