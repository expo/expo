// Copyright 2019-present 650 Industries. All rights reserved.

#import <UMCore/UMAppLifecycleService.h>
#import <UMCore/UMDefines.h>
#import <UMCore/UMEventEmitterService.h>
#import <UMCore/UMModuleRegistryProvider.h>

#import <EXScreenOrientation/EXScreenOrientationModule.h>
#import <EXScreenOrientation/EXScreenOrientationUtilities.h>
#import <EXScreenOrientation/EXScreenOrientationRegistry.h>

#import <UIKit/UIKit.h>

@interface EXScreenOrientationModule ()

@property (nonatomic, weak) EXScreenOrientationRegistry *screenOrienationRegistry;
@property (nonatomic, weak) id<UMEventEmitterService> eventEmitter;
@property (nonatomic, assign) bool hasListeners;

@end

@implementation EXScreenOrientationModule

UM_EXPORT_MODULE(ExpoScreenOrientation);

- (void)setModuleRegistry:(UMModuleRegistry *)moduleRegistry
{
  _hasListeners = NO;
  _eventEmitter = [moduleRegistry getModuleImplementingProtocol:@protocol(UMEventEmitterService)];
  [[moduleRegistry getModuleImplementingProtocol:@protocol(UMAppLifecycleService)] registerAppLifecycleListener:self];

  _screenOrienationRegistry = [moduleRegistry getSingletonModuleForName:@"ScreenOrientationRegistry"];
  [_screenOrienationRegistry registerModuleToReceiveNotification:self];
}

UM_EXPORT_METHOD_AS(lockAsync,
                    lockAsync:(NSNumber *)orientationLock
                    resolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  UIInterfaceOrientationMask orientationMask = [EXScreenOrientationUtilities importOrientationLock:orientationLock];
  if (!orientationMask) {
    return reject(@"ERR_SCREEN_ORIENTATION_INVALID_ORIENTATION_LOCK", [NSString stringWithFormat:@"Invalid screen orientation lock %@", orientationLock], nil);
  }
  if (![EXScreenOrientationUtilities doesDeviceSupportOrientationMask:orientationMask]) {
    return reject(@"ERR_SCREEN_ORIENTATION_UNSUPPORTED_ORIENTATION_LOCK", [NSString stringWithFormat:@"This device does not support this orientation %@", orientationLock], nil);
  }
  
  [_screenOrienationRegistry setMask:orientationMask forModule:self];
  resolve(nil);
}

UM_EXPORT_METHOD_AS(lockPlatformAsync,
                    lockPlatformAsync:(NSArray <NSNumber *> *)allowedOrientations
                    resolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  // combine all the allowedOrientations into one bitmask
  UIInterfaceOrientationMask allowedOrientationsMask = 0;
  for (NSNumber *allowedOrientation in allowedOrientations) {
    UIInterfaceOrientation orientation = [EXScreenOrientationUtilities importOrientation:allowedOrientation];
    UIInterfaceOrientationMask orientationMask = [EXScreenOrientationUtilities maskFromOrientation:orientation];
    allowedOrientationsMask = allowedOrientationsMask | orientationMask;
  }
  
  [_screenOrienationRegistry setMask:allowedOrientationsMask forModule:self];
  resolve(nil);
}

UM_EXPORT_METHOD_AS(getOrientationLockAsync,
                    getOrientationLockAsyncWithResolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  resolve([EXScreenOrientationUtilities exportOrientationLock:[_screenOrienationRegistry currentOrientationMask]]);
}

UM_EXPORT_METHOD_AS(getPlatformOrientationLockAsync,
                    getPlatformOrientationLockAsyncResolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  UIInterfaceOrientationMask orientationMask = [_screenOrienationRegistry currentOrientationMask];
  NSDictionary *maskToOrienationMap = @{
    @(UIInterfaceOrientationMaskPortrait): @(UIInterfaceOrientationPortrait),
    @(UIInterfaceOrientationMaskPortraitUpsideDown): @(UIInterfaceOrientationPortraitUpsideDown),
    @(UIInterfaceOrientationMaskLandscapeLeft): @(UIInterfaceOrientationLandscapeLeft),
    @(UIInterfaceOrientationMaskLandscapeRight): @(UIInterfaceOrientationLandscapeRight)
  };
  // If the particular orientation is supported, we add it to the array of allowedOrientations
  NSMutableArray *allowedOrientations = [[NSMutableArray alloc] init];
  for (NSNumber *wrappedSingleOrientation in [maskToOrienationMap allKeys]) {
    UIInterfaceOrientationMask supportedOrientationMask = orientationMask & [wrappedSingleOrientation intValue];
    if (supportedOrientationMask) {
      UIInterfaceOrientation supportedOrientation = [maskToOrienationMap[@(supportedOrientationMask)] intValue];
      [allowedOrientations addObject:[EXScreenOrientationUtilities exportOrientation:supportedOrientation]];
    }
  }
  resolve(allowedOrientations);
}

UM_EXPORT_METHOD_AS(supportsOrientationLockAsync,
                    supportsOrientationLockAsync:(NSNumber *)orientationLock
                    resolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  UIInterfaceOrientationMask orientationMask = [EXScreenOrientationUtilities importOrientationLock:orientationLock];
  if (!orientationMask) {
    resolve(@NO);
  } else if ([EXScreenOrientationUtilities doesDeviceSupportOrientationMask:orientationMask]) {
    resolve(@YES);
  } else {
    resolve(@NO);
  }
}

UM_EXPORT_METHOD_AS(getOrientationAsync,
                    getOrientationAsyncResolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  resolve([EXScreenOrientationUtilities exportOrientation:[_screenOrienationRegistry currentOrientation]]);
}

// Will be called when this module's first listener is added.
- (void)startObserving
{
  _hasListeners = YES;
}

// Will be called when this module's last listener is removed, or on dealloc.
- (void)stopObserving
{
  _hasListeners = NO;
}

- (void)screenOrientationDidChange:(UIInterfaceOrientation)orientation
{
  [self handleScreenOrientationChange:orientation];
}

- (void)handleScreenOrientationChange:(UIInterfaceOrientation)currentOrientation
{
  if (_hasListeners) {
    [_eventEmitter sendEventWithName:@"expoDidUpdateDimensions" body:@{
      @"orientation": [EXScreenOrientationUtilities exportOrientation:currentOrientation],
      @"orientationLock": [EXScreenOrientationUtilities exportOrientationLock:[_screenOrienationRegistry currentOrientationMask]]
    }];
  }
}

- (NSArray<NSString *> *)supportedEvents {
  return @[@"expoDidUpdateDimensions"];
}

- (void)onAppBackgrounded {
  [_screenOrienationRegistry moduleDidBackground:self];
}

- (void)onAppForegrounded {
  [_screenOrienationRegistry moduleDidForeground:self];
}

@end
