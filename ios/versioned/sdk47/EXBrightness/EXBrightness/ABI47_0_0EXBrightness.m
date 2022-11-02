#import <ABI47_0_0EXBrightness/ABI47_0_0EXBrightness.h>
#import <ABI47_0_0EXBrightness/ABI47_0_0EXSystemBrightnessPermissionRequester.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXUtilities.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXPermissionsInterface.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXPermissionsMethodsDelegate.h>

#import <UIKit/UIKit.h>

@interface ABI47_0_0EXBrightness ()

@property (nonatomic, weak) id<ABI47_0_0EXPermissionsInterface> permissionsManager;
@property (nonatomic, assign) BOOL hasListeners;
@property (nonatomic, weak) id <ABI47_0_0EXEventEmitterService> eventEmitter;

@end

@implementation ABI47_0_0EXBrightness

ABI47_0_0EX_EXPORT_MODULE(ExpoBrightness);

- (void)setModuleRegistry:(ABI47_0_0EXModuleRegistry *)moduleRegistry
{
  _permissionsManager = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI47_0_0EXPermissionsInterface)];
  [ABI47_0_0EXPermissionsMethodsDelegate registerRequesters:@[[ABI47_0_0EXSystemBrightnessPermissionRequester new]] withPermissionsManager:_permissionsManager];
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"Expo.brightnessDidChange"];
}

- (void)startObserving
{
  _hasListeners = YES;
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(brightnessDidChange:)
                                               name:UIScreenBrightnessDidChangeNotification
                                             object:nil];
}

- (void)stopObserving
{
  _hasListeners = NO;
  [[NSNotificationCenter defaultCenter] removeObserver:self
                                                  name:UIScreenBrightnessDidChangeNotification
                                                object:nil];
}

ABI47_0_0EX_EXPORT_METHOD_AS(getPermissionsAsync,
                    getPermissionsAsync:(ABI47_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI47_0_0EXPromiseRejectBlock)reject)
{
  [ABI47_0_0EXPermissionsMethodsDelegate getPermissionWithPermissionsManager:_permissionsManager
                                                      withRequester:[ABI47_0_0EXSystemBrightnessPermissionRequester class]
                                                            resolve:resolve
                                                             reject:reject];
}

ABI47_0_0EX_EXPORT_METHOD_AS(requestPermissionsAsync,
                    requestPermissionsAsync:(ABI47_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI47_0_0EXPromiseRejectBlock)reject)
{
  [ABI47_0_0EXPermissionsMethodsDelegate askForPermissionWithPermissionsManager:_permissionsManager
                                                         withRequester:[ABI47_0_0EXSystemBrightnessPermissionRequester class]
                                                               resolve:resolve
                                                                reject:reject];
}

ABI47_0_0EX_EXPORT_METHOD_AS(setBrightnessAsync,
                    setBrightnessAsync:(NSNumber *)brightnessValue
                    resolver:(ABI47_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI47_0_0EXPromiseRejectBlock)reject)
{
  [ABI47_0_0EXUtilities performSynchronouslyOnMainThread:^{
    [UIScreen mainScreen].brightness = [brightnessValue floatValue];
  }];
  resolve(nil);
}

ABI47_0_0EX_EXPORT_METHOD_AS(getBrightnessAsync,
                    getBrightnessAsyncWithResolver:(ABI47_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI47_0_0EXPromiseRejectBlock)reject)
{
  __block float result = 0;
  [ABI47_0_0EXUtilities performSynchronouslyOnMainThread:^{
    result = [UIScreen mainScreen].brightness;
  }];
  resolve(@(result));
}

- (void)brightnessDidChange:(NSNotification *)notification
{
  if (!_hasListeners) {
    return;
  }
   __block float result = 0;
  [ABI47_0_0EXUtilities performSynchronouslyOnMainThread:^{
    result = [UIScreen mainScreen].brightness;
  }];
  [_eventEmitter sendEventWithName:@"Expo.brightnessDidChange" body:@{@"brightness": @(result)}];
}

ABI47_0_0EX_EXPORT_METHOD_AS(getSystemBrightnessAsync,
                    getSystemBrightnessAsync:(ABI47_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI47_0_0EXPromiseRejectBlock)reject)
{
  // stub for jest-expo-mock-generator
}

ABI47_0_0EX_EXPORT_METHOD_AS(setSystemBrightnessAsync,
                    setSystemBrightnessAsync:(ABI47_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI47_0_0EXPromiseRejectBlock)reject)
{
  // stub for jest-expo-mock-generator
}

ABI47_0_0EX_EXPORT_METHOD_AS(useSystemBrightnessAsync,
                    useSystemBrightnessAsync:(ABI47_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI47_0_0EXPromiseRejectBlock)reject)
{
  // stub for jest-expo-mock-generator
}

ABI47_0_0EX_EXPORT_METHOD_AS(isUsingSystemBrightnessAsync,
                    isUsingSystemBrightnessAsync:(ABI47_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI47_0_0EXPromiseRejectBlock)reject)
{
  // stub for jest-expo-mock-generator
}

ABI47_0_0EX_EXPORT_METHOD_AS(getSystemBrightnessModeAsync,
                    getSystemBrightnessModeAsync:(ABI47_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI47_0_0EXPromiseRejectBlock)reject)
{
  // stub for jest-expo-mock-generator
}

ABI47_0_0EX_EXPORT_METHOD_AS(setSystemBrightnessModeAsync,
                    setSystemBrightnessModeAsync:(ABI47_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI47_0_0EXPromiseRejectBlock)reject)
{
  // stub for jest-expo-mock-generator
}

@end
