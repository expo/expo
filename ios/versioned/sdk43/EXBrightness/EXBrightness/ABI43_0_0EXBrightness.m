#import <ABI43_0_0EXBrightness/ABI43_0_0EXBrightness.h>
#import <ABI43_0_0EXBrightness/ABI43_0_0EXSystemBrightnessPermissionRequester.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXUtilities.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXPermissionsInterface.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXPermissionsMethodsDelegate.h>

#import <UIKit/UIKit.h>

@interface ABI43_0_0EXBrightness ()

@property (nonatomic, weak) id<ABI43_0_0EXPermissionsInterface> permissionsManager;

@end

@implementation ABI43_0_0EXBrightness

ABI43_0_0EX_EXPORT_MODULE(ExpoBrightness);

- (void)setModuleRegistry:(ABI43_0_0EXModuleRegistry *)moduleRegistry
{
  _permissionsManager = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI43_0_0EXPermissionsInterface)];
  [ABI43_0_0EXPermissionsMethodsDelegate registerRequesters:@[[ABI43_0_0EXSystemBrightnessPermissionRequester new]] withPermissionsManager:_permissionsManager];
}

ABI43_0_0EX_EXPORT_METHOD_AS(getPermissionsAsync,
                    getPermissionsAsync:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  [ABI43_0_0EXPermissionsMethodsDelegate getPermissionWithPermissionsManager:_permissionsManager
                                                      withRequester:[ABI43_0_0EXSystemBrightnessPermissionRequester class]
                                                            resolve:resolve
                                                             reject:reject];
}

ABI43_0_0EX_EXPORT_METHOD_AS(requestPermissionsAsync,
                    requestPermissionsAsync:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  [ABI43_0_0EXPermissionsMethodsDelegate askForPermissionWithPermissionsManager:_permissionsManager
                                                         withRequester:[ABI43_0_0EXSystemBrightnessPermissionRequester class]
                                                               resolve:resolve
                                                                reject:reject];
}

ABI43_0_0EX_EXPORT_METHOD_AS(setBrightnessAsync,
                    setBrightnessAsync:(NSNumber *)brightnessValue
                    resolver:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  [ABI43_0_0EXUtilities performSynchronouslyOnMainThread:^{
    [UIScreen mainScreen].brightness = [brightnessValue floatValue];
  }];
  resolve(nil);
}

ABI43_0_0EX_EXPORT_METHOD_AS(getBrightnessAsync,
                    getBrightnessAsyncWithResolver:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  __block float result = 0;
  [ABI43_0_0EXUtilities performSynchronouslyOnMainThread:^{
    result = [UIScreen mainScreen].brightness;
  }];
  resolve(@(result));
}

ABI43_0_0EX_EXPORT_METHOD_AS(getSystemBrightnessAsync,
                    getSystemBrightnessAsync:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  // stub for jest-expo-mock-generator
}

ABI43_0_0EX_EXPORT_METHOD_AS(setSystemBrightnessAsync,
                    setSystemBrightnessAsync:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  // stub for jest-expo-mock-generator
}

ABI43_0_0EX_EXPORT_METHOD_AS(useSystemBrightnessAsync,
                    useSystemBrightnessAsync:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  // stub for jest-expo-mock-generator
}

ABI43_0_0EX_EXPORT_METHOD_AS(isUsingSystemBrightnessAsync,
                    isUsingSystemBrightnessAsync:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  // stub for jest-expo-mock-generator
}

ABI43_0_0EX_EXPORT_METHOD_AS(getSystemBrightnessModeAsync,
                    getSystemBrightnessModeAsync:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  // stub for jest-expo-mock-generator
}

ABI43_0_0EX_EXPORT_METHOD_AS(setSystemBrightnessModeAsync,
                    setSystemBrightnessModeAsync:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  // stub for jest-expo-mock-generator
}

@end
