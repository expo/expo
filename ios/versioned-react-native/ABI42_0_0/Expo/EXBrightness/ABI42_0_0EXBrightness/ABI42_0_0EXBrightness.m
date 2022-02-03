#import <ABI42_0_0EXBrightness/ABI42_0_0EXBrightness.h>
#import <ABI42_0_0EXBrightness/ABI42_0_0EXSystemBrightnessPermissionRequester.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMUtilities.h>
#import <ABI42_0_0ExpoModulesCore/ABI42_0_0EXPermissionsInterface.h>
#import <ABI42_0_0ExpoModulesCore/ABI42_0_0EXPermissionsMethodsDelegate.h>

#import <UIKit/UIKit.h>

@interface ABI42_0_0EXBrightness ()

@property (nonatomic, weak) id<ABI42_0_0EXPermissionsInterface> permissionsManager;

@end

@implementation ABI42_0_0EXBrightness

ABI42_0_0UM_EXPORT_MODULE(ExpoBrightness);

- (void)setModuleRegistry:(ABI42_0_0UMModuleRegistry *)moduleRegistry
{
  _permissionsManager = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI42_0_0EXPermissionsInterface)];
  [ABI42_0_0EXPermissionsMethodsDelegate registerRequesters:@[[ABI42_0_0EXSystemBrightnessPermissionRequester new]] withPermissionsManager:_permissionsManager];
}

ABI42_0_0UM_EXPORT_METHOD_AS(getPermissionsAsync,
                    getPermissionsAsync:(ABI42_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI42_0_0UMPromiseRejectBlock)reject)
{
  [ABI42_0_0EXPermissionsMethodsDelegate getPermissionWithPermissionsManager:_permissionsManager
                                                      withRequester:[ABI42_0_0EXSystemBrightnessPermissionRequester class]
                                                            resolve:resolve
                                                             reject:reject];
}

ABI42_0_0UM_EXPORT_METHOD_AS(requestPermissionsAsync,
                    requestPermissionsAsync:(ABI42_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI42_0_0UMPromiseRejectBlock)reject)
{
  [ABI42_0_0EXPermissionsMethodsDelegate askForPermissionWithPermissionsManager:_permissionsManager
                                                         withRequester:[ABI42_0_0EXSystemBrightnessPermissionRequester class]
                                                               resolve:resolve
                                                                reject:reject];
}

ABI42_0_0UM_EXPORT_METHOD_AS(setBrightnessAsync,
                    setBrightnessAsync:(NSNumber *)brightnessValue
                    resolver:(ABI42_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI42_0_0UMPromiseRejectBlock)reject)
{
  [ABI42_0_0UMUtilities performSynchronouslyOnMainThread:^{
    [UIScreen mainScreen].brightness = [brightnessValue floatValue];
  }];
  resolve(nil);
}

ABI42_0_0UM_EXPORT_METHOD_AS(getBrightnessAsync,
                    getBrightnessAsyncWithResolver:(ABI42_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI42_0_0UMPromiseRejectBlock)reject)
{
  __block float result = 0;
  [ABI42_0_0UMUtilities performSynchronouslyOnMainThread:^{
    result = [UIScreen mainScreen].brightness;
  }];
  resolve(@(result));
}

ABI42_0_0UM_EXPORT_METHOD_AS(getSystemBrightnessAsync,
                    getSystemBrightnessAsync:(ABI42_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI42_0_0UMPromiseRejectBlock)reject)
{
  // stub for jest-expo-mock-generator
}

ABI42_0_0UM_EXPORT_METHOD_AS(setSystemBrightnessAsync,
                    setSystemBrightnessAsync:(ABI42_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI42_0_0UMPromiseRejectBlock)reject)
{
  // stub for jest-expo-mock-generator
}

ABI42_0_0UM_EXPORT_METHOD_AS(useSystemBrightnessAsync,
                    useSystemBrightnessAsync:(ABI42_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI42_0_0UMPromiseRejectBlock)reject)
{
  // stub for jest-expo-mock-generator
}

ABI42_0_0UM_EXPORT_METHOD_AS(isUsingSystemBrightnessAsync,
                    isUsingSystemBrightnessAsync:(ABI42_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI42_0_0UMPromiseRejectBlock)reject)
{
  // stub for jest-expo-mock-generator
}

ABI42_0_0UM_EXPORT_METHOD_AS(getSystemBrightnessModeAsync,
                    getSystemBrightnessModeAsync:(ABI42_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI42_0_0UMPromiseRejectBlock)reject)
{
  // stub for jest-expo-mock-generator
}

ABI42_0_0UM_EXPORT_METHOD_AS(setSystemBrightnessModeAsync,
                    setSystemBrightnessModeAsync:(ABI42_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI42_0_0UMPromiseRejectBlock)reject)
{
  // stub for jest-expo-mock-generator
}

@end
