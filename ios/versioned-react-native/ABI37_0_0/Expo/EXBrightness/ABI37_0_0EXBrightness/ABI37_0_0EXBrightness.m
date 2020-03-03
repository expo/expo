#import <ABI37_0_0EXBrightness/ABI37_0_0EXBrightness.h>
#import <ABI37_0_0EXBrightness/ABI37_0_0EXSystemBrightnessPermissionRequester.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMUtilities.h>
#import <ABI37_0_0UMPermissionsInterface/ABI37_0_0UMPermissionsInterface.h>
#import <ABI37_0_0UMPermissionsInterface/ABI37_0_0UMPermissionsMethodsDelegate.h>

#import <UIKit/UIKit.h>

@interface ABI37_0_0EXBrightness ()

@property (nonatomic, weak) id<ABI37_0_0UMPermissionsInterface> permissionsManager;

@end

@implementation ABI37_0_0EXBrightness

ABI37_0_0UM_EXPORT_MODULE(ExpoBrightness);

- (void)setModuleRegistry:(ABI37_0_0UMModuleRegistry *)moduleRegistry
{
  _permissionsManager = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI37_0_0UMPermissionsInterface)];
  [ABI37_0_0UMPermissionsMethodsDelegate registerRequesters:@[[ABI37_0_0EXSystemBrightnessPermissionRequester new]] withPermissionsManager:_permissionsManager];
}

ABI37_0_0UM_EXPORT_METHOD_AS(getPermissionsAsync,
                    getPermissionsAsync:(ABI37_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI37_0_0UMPromiseRejectBlock)reject)
{
  [ABI37_0_0UMPermissionsMethodsDelegate getPermissionWithPermissionsManager:_permissionsManager
                                                      withRequester:[ABI37_0_0EXSystemBrightnessPermissionRequester class]
                                                            resolve:resolve
                                                             reject:reject];
}

ABI37_0_0UM_EXPORT_METHOD_AS(requestPermissionsAsync,
                    requestPermissionsAsync:(ABI37_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI37_0_0UMPromiseRejectBlock)reject)
{
  [ABI37_0_0UMPermissionsMethodsDelegate askForPermissionWithPermissionsManager:_permissionsManager
                                                         withRequester:[ABI37_0_0EXSystemBrightnessPermissionRequester class]
                                                               resolve:resolve
                                                                reject:reject];
}

ABI37_0_0UM_EXPORT_METHOD_AS(setBrightnessAsync,
                    setBrightnessAsync:(NSNumber *)brightnessValue
                    resolver:(ABI37_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI37_0_0UMPromiseRejectBlock)reject)
{
  [ABI37_0_0UMUtilities performSynchronouslyOnMainThread:^{
    [UIScreen mainScreen].brightness = [brightnessValue floatValue];
  }];
  resolve(nil);
}

ABI37_0_0UM_EXPORT_METHOD_AS(getBrightnessAsync,
                    getBrightnessAsyncWithResolver:(ABI37_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI37_0_0UMPromiseRejectBlock)reject)
{
  __block float result = 0;
  [ABI37_0_0UMUtilities performSynchronouslyOnMainThread:^{
    result = [UIScreen mainScreen].brightness;
  }];
  resolve(@(result));
}

ABI37_0_0UM_EXPORT_METHOD_AS(getSystemBrightnessAsync,
                    getSystemBrightnessAsync:(ABI37_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI37_0_0UMPromiseRejectBlock)reject)
{
  // stub for jest-expo-mock-generator
}

ABI37_0_0UM_EXPORT_METHOD_AS(setSystemBrightnessAsync,
                    setSystemBrightnessAsync:(ABI37_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI37_0_0UMPromiseRejectBlock)reject)
{
  // stub for jest-expo-mock-generator
}

ABI37_0_0UM_EXPORT_METHOD_AS(useSystemBrightnessAsync,
                    useSystemBrightnessAsync:(ABI37_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI37_0_0UMPromiseRejectBlock)reject)
{
  // stub for jest-expo-mock-generator
}

ABI37_0_0UM_EXPORT_METHOD_AS(isUsingSystemBrightnessAsync,
                    isUsingSystemBrightnessAsync:(ABI37_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI37_0_0UMPromiseRejectBlock)reject)
{
  // stub for jest-expo-mock-generator
}

ABI37_0_0UM_EXPORT_METHOD_AS(getSystemBrightnessModeAsync,
                    getSystemBrightnessModeAsync:(ABI37_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI37_0_0UMPromiseRejectBlock)reject)
{
  // stub for jest-expo-mock-generator
}

ABI37_0_0UM_EXPORT_METHOD_AS(setSystemBrightnessModeAsync,
                    setSystemBrightnessModeAsync:(ABI37_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI37_0_0UMPromiseRejectBlock)reject)
{
  // stub for jest-expo-mock-generator
}

@end
