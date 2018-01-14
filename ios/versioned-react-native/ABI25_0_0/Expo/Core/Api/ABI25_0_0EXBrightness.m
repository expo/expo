#import "ABI25_0_0EXBrightness.h"
#import "ABI25_0_0EXUtil.h"

#import <UIKit/UIKit.h>

@implementation ABI25_0_0EXBrightness

ABI25_0_0RCT_EXPORT_MODULE(ExponentBrightness);


ABI25_0_0RCT_EXPORT_METHOD(setBrightnessAsync:
                  (float)brightnessValue
                  resolver:(ABI25_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(ABI25_0_0RCTPromiseRejectBlock)reject)
{
  [ABI25_0_0EXUtil performSynchronouslyOnMainThread:^{
    [UIScreen mainScreen].brightness = brightnessValue;
  }];
  resolve(nil);
}

ABI25_0_0RCT_REMAP_METHOD(getBrightnessAsync,
                 resolver:(ABI25_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI25_0_0RCTPromiseRejectBlock)reject)
{
  __block float result = 0;
  [ABI25_0_0EXUtil performSynchronouslyOnMainThread:^{
    result = [UIScreen mainScreen].brightness;
  }];
  resolve(@(result));
}

@end
