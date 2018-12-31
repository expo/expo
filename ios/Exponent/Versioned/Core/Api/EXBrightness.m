#import "EXBrightness.h"
#import "EXUtil.h"

#import <UIKit/UIKit.h>

@implementation EXBrightness

RCT_EXPORT_MODULE(ExpoBrightness);


RCT_EXPORT_METHOD(setBrightnessAsync:(float)brightnessValue
                            resolver:(RCTPromiseResolveBlock)resolve
                            rejecter:(RCTPromiseRejectBlock)reject)
{
  [EXUtil performSynchronouslyOnMainThread:^{
    [UIScreen mainScreen].brightness = brightnessValue;
  }];
  resolve(nil);
}

RCT_REMAP_METHOD(getBrightnessAsync,
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  __block float result = 0;
  [EXUtil performSynchronouslyOnMainThread:^{
    result = [UIScreen mainScreen].brightness;
  }];
  resolve(@(result));
}

RCT_EXPORT_METHOD(getSystemBrightnessAsync:(RCTPromiseResolveBlock)resolve
                                  rejecter:(RCTPromiseRejectBlock)reject)
{
  // stub for jest-expo-mock-generator
}

RCT_EXPORT_METHOD(setSystemBrightnessAsync:(RCTPromiseResolveBlock)resolve
                                  rejecter:(RCTPromiseRejectBlock)reject)
{
  // stub for jest-expo-mock-generator
}

RCT_EXPORT_METHOD(useSystemBrightnessAsync:(RCTPromiseResolveBlock)resolve
                                  rejecter:(RCTPromiseRejectBlock)reject)
{
  // stub for jest-expo-mock-generator
}

RCT_EXPORT_METHOD(isUsingSystemBrightnessAsync:(RCTPromiseResolveBlock)resolve
                                      rejecter:(RCTPromiseRejectBlock)reject)
{
  // stub for jest-expo-mock-generator
}

RCT_EXPORT_METHOD(getSystemBrightnessModeAsync:(RCTPromiseResolveBlock)resolve
                                      rejecter:(RCTPromiseRejectBlock)reject)
{
  // stub for jest-expo-mock-generator
}

RCT_EXPORT_METHOD(setSystemBrightnessModeAsync:(RCTPromiseResolveBlock)resolve
                                      rejecter:(RCTPromiseRejectBlock)reject)
{
  // stub for jest-expo-mock-generator
}

@end
