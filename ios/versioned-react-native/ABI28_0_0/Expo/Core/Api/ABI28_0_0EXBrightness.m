#import "ABI28_0_0EXBrightness.h"
#import "ABI28_0_0EXUtil.h"

#import <UIKit/UIKit.h>

@implementation ABI28_0_0EXBrightness

ABI28_0_0RCT_EXPORT_MODULE(ExponentBrightness);


ABI28_0_0RCT_EXPORT_METHOD(setBrightnessAsync:
                  (float)brightnessValue
                  resolver:(ABI28_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(ABI28_0_0RCTPromiseRejectBlock)reject)
{
  [ABI28_0_0EXUtil performSynchronouslyOnMainThread:^{
    [UIScreen mainScreen].brightness = brightnessValue;
  }];
  resolve(nil);
}

ABI28_0_0RCT_REMAP_METHOD(getBrightnessAsync,
                 resolver:(ABI28_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI28_0_0RCTPromiseRejectBlock)reject)
{
  __block float result = 0;
  [ABI28_0_0EXUtil performSynchronouslyOnMainThread:^{
    result = [UIScreen mainScreen].brightness;
  }];
  resolve(@(result));
}

@end
