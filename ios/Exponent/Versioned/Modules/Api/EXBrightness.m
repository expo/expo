#import "EXBrightness.h"

#import <UIKit/UIKit.h>

@implementation EXBrightness

RCT_EXPORT_MODULE(ExponentBrightness);


RCT_EXPORT_METHOD(setBrightnessAsync:
                  (float)brightnessValue
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  [self _performSynchronouslyOnMainThread:^{
    [UIScreen mainScreen].brightness = brightnessValue;
  }];
  resolve(nil);
}

RCT_REMAP_METHOD(getBrightnessAsync,
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
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
