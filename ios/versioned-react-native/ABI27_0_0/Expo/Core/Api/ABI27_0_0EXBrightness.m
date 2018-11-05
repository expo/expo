#import "ABI27_0_0EXBrightness.h"
#import "ABI27_0_0EXUtil.h"

#import <UIKit/UIKit.h>

@implementation ABI27_0_0EXBrightness

ABI27_0_0RCT_EXPORT_MODULE(ExponentBrightness);


ABI27_0_0RCT_EXPORT_METHOD(setBrightnessAsync:
                  (float)brightnessValue
                  resolver:(ABI27_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(ABI27_0_0RCTPromiseRejectBlock)reject)
{
  [ABI27_0_0EXUtil performSynchronouslyOnMainThread:^{
    [UIScreen mainScreen].brightness = brightnessValue;
  }];
  resolve(nil);
}

ABI27_0_0RCT_REMAP_METHOD(getBrightnessAsync,
                 resolver:(ABI27_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI27_0_0RCTPromiseRejectBlock)reject)
{
  __block float result = 0;
  [ABI27_0_0EXUtil performSynchronouslyOnMainThread:^{
    result = [UIScreen mainScreen].brightness;
  }];
  resolve(@(result));
}

@end
