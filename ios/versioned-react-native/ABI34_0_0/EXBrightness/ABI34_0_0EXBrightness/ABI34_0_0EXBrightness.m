#import <ABI34_0_0EXBrightness/ABI34_0_0EXBrightness.h>
#import <ABI34_0_0UMCore/ABI34_0_0UMUtilities.h>

#import <UIKit/UIKit.h>

@implementation ABI34_0_0EXBrightness

ABI34_0_0UM_EXPORT_MODULE(ExpoBrightness);


ABI34_0_0UM_EXPORT_METHOD_AS(setBrightnessAsync,
                    setBrightnessAsync:(NSNumber *)brightnessValue
                    resolver:(ABI34_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI34_0_0UMPromiseRejectBlock)reject)
{
  [ABI34_0_0UMUtilities performSynchronouslyOnMainThread:^{
    [UIScreen mainScreen].brightness = [brightnessValue floatValue];
  }];
  resolve(nil);
}

ABI34_0_0UM_EXPORT_METHOD_AS(getBrightnessAsync,
                    getBrightnessAsyncWithResolver:(ABI34_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI34_0_0UMPromiseRejectBlock)reject)
{
  __block float result = 0;
  [ABI34_0_0UMUtilities performSynchronouslyOnMainThread:^{
    result = [UIScreen mainScreen].brightness;
  }];
  resolve(@(result));
}

ABI34_0_0UM_EXPORT_METHOD_AS(getSystemBrightnessAsync,
                    getSystemBrightnessAsync:(ABI34_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI34_0_0UMPromiseRejectBlock)reject)
{
  // stub for jest-expo-mock-generator
}

ABI34_0_0UM_EXPORT_METHOD_AS(setSystemBrightnessAsync,
                    setSystemBrightnessAsync:(ABI34_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI34_0_0UMPromiseRejectBlock)reject)
{
  // stub for jest-expo-mock-generator
}

ABI34_0_0UM_EXPORT_METHOD_AS(useSystemBrightnessAsync,
                    useSystemBrightnessAsync:(ABI34_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI34_0_0UMPromiseRejectBlock)reject)
{
  // stub for jest-expo-mock-generator
}

ABI34_0_0UM_EXPORT_METHOD_AS(isUsingSystemBrightnessAsync,
                    isUsingSystemBrightnessAsync:(ABI34_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI34_0_0UMPromiseRejectBlock)reject)
{
  // stub for jest-expo-mock-generator
}

ABI34_0_0UM_EXPORT_METHOD_AS(getSystemBrightnessModeAsync,
                    getSystemBrightnessModeAsync:(ABI34_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI34_0_0UMPromiseRejectBlock)reject)
{
  // stub for jest-expo-mock-generator
}

ABI34_0_0UM_EXPORT_METHOD_AS(setSystemBrightnessModeAsync,
                    setSystemBrightnessModeAsync:(ABI34_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI34_0_0UMPromiseRejectBlock)reject)
{
  // stub for jest-expo-mock-generator
}

@end
