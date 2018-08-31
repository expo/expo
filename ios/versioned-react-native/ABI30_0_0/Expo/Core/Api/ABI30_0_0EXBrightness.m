#import "ABI30_0_0EXBrightness.h"
#import "ABI30_0_0EXUtil.h"

#import <UIKit/UIKit.h>

@implementation ABI30_0_0EXBrightness

ABI30_0_0RCT_EXPORT_MODULE(ExponentBrightness);


ABI30_0_0RCT_EXPORT_METHOD(setBrightnessAsync:
                  (float)brightnessValue
                  resolver:(ABI30_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(ABI30_0_0RCTPromiseRejectBlock)reject)
{
  [ABI30_0_0EXUtil performSynchronouslyOnMainThread:^{
    [UIScreen mainScreen].brightness = brightnessValue;
  }];
  resolve(nil);
}

ABI30_0_0RCT_REMAP_METHOD(getBrightnessAsync,
                 resolver:(ABI30_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI30_0_0RCTPromiseRejectBlock)reject)
{
  __block float result = 0;
  [ABI30_0_0EXUtil performSynchronouslyOnMainThread:^{
    result = [UIScreen mainScreen].brightness;
  }];
  resolve(@(result));
}

@end
