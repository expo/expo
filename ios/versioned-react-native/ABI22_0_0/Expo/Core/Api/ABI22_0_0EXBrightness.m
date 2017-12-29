#import "ABI22_0_0EXBrightness.h"

#import <UIKit/UIKit.h>

@implementation ABI22_0_0EXBrightness

ABI22_0_0RCT_EXPORT_MODULE(ExponentBrightness);


ABI22_0_0RCT_EXPORT_METHOD(setBrightnessAsync:
                  (float)brightnessValue
                  resolver:(ABI22_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(ABI22_0_0RCTPromiseRejectBlock)reject)
{
  [self _performSynchronouslyOnMainThread:^{
    [UIScreen mainScreen].brightness = brightnessValue;
  }];
  resolve(nil);
}

ABI22_0_0RCT_REMAP_METHOD(getBrightnessAsync,
                 resolver:(ABI22_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI22_0_0RCTPromiseRejectBlock)reject)
{
  __block float result = 0;
  [self _performSynchronouslyOnMainThread:^{
    result = [UIScreen mainScreen].brightness;
  }];
  resolve(@(result));
}

- (void)_performSynchronouslyOnMainThread:(void (^)(void))block
{
  if ([NSThread isMainThread]) {
    block();
  } else {
    dispatch_sync(dispatch_get_main_queue(), block);
  }
}

@end
