#import "ABI29_0_0EXBrightness.h"
#import "ABI29_0_0EXUtil.h"

#import <UIKit/UIKit.h>

@implementation ABI29_0_0EXBrightness

ABI29_0_0RCT_EXPORT_MODULE(ExponentBrightness);


ABI29_0_0RCT_EXPORT_METHOD(setBrightnessAsync:
                  (float)brightnessValue
                  resolver:(ABI29_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(ABI29_0_0RCTPromiseRejectBlock)reject)
{
  [ABI29_0_0EXUtil performSynchronouslyOnMainThread:^{
    [UIScreen mainScreen].brightness = brightnessValue;
  }];
  resolve(nil);
}

ABI29_0_0RCT_REMAP_METHOD(getBrightnessAsync,
                 resolver:(ABI29_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI29_0_0RCTPromiseRejectBlock)reject)
{
  __block float result = 0;
  [ABI29_0_0EXUtil performSynchronouslyOnMainThread:^{
    result = [UIScreen mainScreen].brightness;
  }];
  resolve(@(result));
}

@end
