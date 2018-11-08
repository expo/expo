#import "ABI31_0_0EXBrightness.h"
#import "ABI31_0_0EXUtil.h"

#import <UIKit/UIKit.h>

@implementation ABI31_0_0EXBrightness

ABI31_0_0RCT_EXPORT_MODULE(ExponentBrightness);


ABI31_0_0RCT_EXPORT_METHOD(setBrightnessAsync:
                  (float)brightnessValue
                  resolver:(ABI31_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(ABI31_0_0RCTPromiseRejectBlock)reject)
{
  [ABI31_0_0EXUtil performSynchronouslyOnMainThread:^{
    [UIScreen mainScreen].brightness = brightnessValue;
  }];
  resolve(nil);
}

ABI31_0_0RCT_REMAP_METHOD(getBrightnessAsync,
                 resolver:(ABI31_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI31_0_0RCTPromiseRejectBlock)reject)
{
  __block float result = 0;
  [ABI31_0_0EXUtil performSynchronouslyOnMainThread:^{
    result = [UIScreen mainScreen].brightness;
  }];
  resolve(@(result));
}

@end
