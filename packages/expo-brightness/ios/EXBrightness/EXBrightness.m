#import <EXBrightness/EXBrightness.h>
#import <EXBrightness/EXSystemBrightnessRequester.h>
#import <UMCore/UMUtilities.h>
#import <UMPermissionsInterface/UMPermissionsInterface.h>
#import <UMPermissionsInterface/UMPermissionsMethodsDelegate.h>

#import <UIKit/UIKit.h>

@interface EXBrightness ()

@property (nonatomic, weak) id<UMPermissionsInterface> permissionsManager;

@end

@implementation EXBrightness

UM_EXPORT_MODULE(ExpoBrightness);

- (void)setModuleRegistry:(UMModuleRegistry *)moduleRegistry
{
  _permissionsManager = [moduleRegistry getModuleImplementingProtocol:@protocol(UMPermissionsInterface)];
  [UMPermissionsMethodsDelegate registerRequesters:@[[EXSystemBrightnessRequester new]] withPermissionsManager:_permissionsManager];
}

UM_EXPORT_METHOD_AS(getPermissionsAsync,
                    getPermissionsAsync:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  [UMPermissionsMethodsDelegate getPermissionWithPermissionsManager:_permissionsManager
                                                     withRequester:[EXSystemBrightnessRequester class]
                                                        withResult:resolve
                                                      withRejecter:reject];
}

UM_EXPORT_METHOD_AS(requestPermissionsAsync,
                    requestPermissionsAsync:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  [UMPermissionsMethodsDelegate askForPermissionWithPermissionsManger:_permissionsManager
                                                       withRequester:[EXSystemBrightnessRequester class]
                                                          withResult:resolve
                                                        withRejecter:reject];
}

UM_EXPORT_METHOD_AS(setBrightnessAsync,
                    setBrightnessAsync:(NSNumber *)brightnessValue
                    resolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  [UMUtilities performSynchronouslyOnMainThread:^{
    [UIScreen mainScreen].brightness = [brightnessValue floatValue];
  }];
  resolve(nil);
}

UM_EXPORT_METHOD_AS(getBrightnessAsync,
                    getBrightnessAsyncWithResolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  __block float result = 0;
  [UMUtilities performSynchronouslyOnMainThread:^{
    result = [UIScreen mainScreen].brightness;
  }];
  resolve(@(result));
}

UM_EXPORT_METHOD_AS(getSystemBrightnessAsync,
                    getSystemBrightnessAsync:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  // stub for jest-expo-mock-generator
}

UM_EXPORT_METHOD_AS(setSystemBrightnessAsync,
                    setSystemBrightnessAsync:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  // stub for jest-expo-mock-generator
}

UM_EXPORT_METHOD_AS(useSystemBrightnessAsync,
                    useSystemBrightnessAsync:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  // stub for jest-expo-mock-generator
}

UM_EXPORT_METHOD_AS(isUsingSystemBrightnessAsync,
                    isUsingSystemBrightnessAsync:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  // stub for jest-expo-mock-generator
}

UM_EXPORT_METHOD_AS(getSystemBrightnessModeAsync,
                    getSystemBrightnessModeAsync:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  // stub for jest-expo-mock-generator
}

UM_EXPORT_METHOD_AS(setSystemBrightnessModeAsync,
                    setSystemBrightnessModeAsync:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  // stub for jest-expo-mock-generator
}

@end
