#import "ABI26_0_0EXBrightness.h"
#import "ABI26_0_0EXUtil.h"

#import <UIKit/UIKit.h>

@implementation ABI26_0_0EXBrightness

ABI26_0_0RCT_EXPORT_MODULE(ExponentBrightness);


ABI26_0_0RCT_EXPORT_METHOD(setBrightnessAsync:
                  (float)brightnessValue
                  resolver:(ABI26_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(ABI26_0_0RCTPromiseRejectBlock)reject)
{
  [ABI26_0_0EXUtil performSynchronouslyOnMainThread:^{
    [UIScreen mainScreen].brightness = brightnessValue;
  }];
  resolve(nil);
}

ABI26_0_0RCT_REMAP_METHOD(getBrightnessAsync,
                 resolver:(ABI26_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI26_0_0RCTPromiseRejectBlock)reject)
{
  __block float result = 0;
  [ABI26_0_0EXUtil performSynchronouslyOnMainThread:^{
    result = [UIScreen mainScreen].brightness;
  }];
  resolve(@(result));
}

@end
