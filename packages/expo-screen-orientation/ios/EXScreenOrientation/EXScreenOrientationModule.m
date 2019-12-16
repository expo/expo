// Copyright 2019-present 650 Industries. All rights reserved.

#import <EXScreenOrientation/EXScreenOrientationModule.h>
#import <UMCore/UMEventEmitterService.h>
#import <UMCore/UMDefines.h>
#import <UMCore/UMModuleRegistryProvider.h>
#import <EXScreenOrientation/EXScreenOrientationUtilities.h>

#import <UIKit/UIKit.h>

@interface EXScreenOrientationModule ()

@property (nonatomic, weak) id<UMEventEmitterService> eventEmitter;
@property (nonatomic, assign) bool hasListeners;
@property (nonatomic, assign) UIInterfaceOrientation currentScreenOrientation;
@property (nonatomic, assign) UIInterfaceOrientationMask currentScreenOrientationMask;

@end

@implementation EXScreenOrientationModule

UM_EXPORT_MODULE(ExpoScreenOrientation);

- (instancetype)init {
  if (self = [super init]) {
    _currentScreenOrientationMask = 0;
  }
  
  return self;
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
  
  dispatch_async(dispatch_get_main_queue(), ^{
    [[UIDevice currentDevice] endGeneratingDeviceOrientationNotifications];
  });
}

- (void)setModuleRegistry:(UMModuleRegistry *)moduleRegistry
{
  _eventEmitter = [moduleRegistry getModuleImplementingProtocol:@protocol(UMEventEmitterService)];
  _hasListeners = NO;
  
  dispatch_async(dispatch_get_main_queue(), ^{
    if (![[UIDevice currentDevice] isGeneratingDeviceOrientationNotifications]){
        [[UIDevice currentDevice] beginGeneratingDeviceOrientationNotifications];
    }
  });

  _currentScreenOrientationMask = [[[[UIApplication sharedApplication] keyWindow] rootViewController] supportedInterfaceOrientations];
  _currentScreenOrientation = [UIApplication sharedApplication].statusBarOrientation;
  [self enforceDesiredDeviceOrientationWithOrientationMask:_currentScreenOrientationMask];
}

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(UMScreenOrientationInterface)];
}

// UMScreenOrienationInterface method
- (UIInterfaceOrientationMask)getSupportedInterfaceOrientations {
  return _currentScreenOrientationMask;
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
  if (![EXScreenOrientationUtilities doesSupportOrientationMask:orientationMask]) {
    return reject(@"ERR_SCREEN_ORIENTATION_UNSUPPORTED_ORIENTATION_LOCK", [NSString stringWithFormat:@"This device does not support this orientation %@", orientationLock], nil);
  }
  _currentScreenOrientationMask = orientationMask;
  [self enforceDesiredDeviceOrientationWithOrientationMask:orientationMask];
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
  _currentScreenOrientationMask = allowedOrientationsMask;
  [self enforceDesiredDeviceOrientationWithOrientationMask:allowedOrientationsMask];
  resolve(nil);
}

UM_EXPORT_METHOD_AS(getOrientationLockAsync,
                    getOrientationLockAsyncWithResolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  resolve([EXScreenOrientationUtilities exportOrientationLock:[self getSupportedInterfaceOrientations]]);
}

UM_EXPORT_METHOD_AS(getPlatformOrientationLockAsync,
                    getPlatformOrientationLockAsyncResolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
    UIInterfaceOrientationMask orientationMask = [self getSupportedInterfaceOrientations];
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
  } else if ([EXScreenOrientationUtilities doesSupportOrientationMask:orientationMask]) {
    resolve(@YES);
  } else {
    resolve(@NO);
  }
}

UM_EXPORT_METHOD_AS(getOrientationAsync,
                    getOrientationAsyncResolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  resolve([EXScreenOrientationUtilities exportOrientation:_currentScreenOrientation]);
}

// Will be called when this module's first listener is added.
- (void)startObserving
{
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleDeviceOrientationChange:)
                                               name:UIDeviceOrientationDidChangeNotification
                                             object:[UIDevice currentDevice]];
  _hasListeners = YES;
}

// Will be called when this module's last listener is removed, or on dealloc.
- (void)stopObserving
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
  _hasListeners = NO;
}

- (void)handleDeviceOrientationChange:(NSNotification *)notification
{
  UIDevice *device = notification.object;
  UIInterfaceOrientation currentDeviceOrientation = [EXScreenOrientationUtilities UIDeviceOrientationToUIInterfaceOrientation:[device orientation]];
  UIInterfaceOrientationMask currentOrientationMask = [self getSupportedInterfaceOrientations];
  
  // checks if screen orientation should be changed when user rotates the device
  if ([EXScreenOrientationUtilities doesOrientationMask:currentOrientationMask containOrientation:currentDeviceOrientation] && _currentScreenOrientation != currentDeviceOrientation) {
    // updates the current screen orientation
    _currentScreenOrientation = currentDeviceOrientation;
    
    // we sends event only if current screen orientation was changed
    [self handleScreenOrientationChange];
  }
}

- (void)handleScreenOrientationChange
{
  if (_hasListeners) {
    [_eventEmitter sendEventWithName:@"expoDidUpdateDimensions" body:@{
      @"orientation": [EXScreenOrientationUtilities exportOrientation:_currentScreenOrientation],
      @"orientationLock": [EXScreenOrientationUtilities exportOrientationLock:[self getSupportedInterfaceOrientations]]
    }];
  }
}

- (NSArray<NSString *> *)supportedEvents {
  return @[@"expoDidUpdateDimensions"];
}

- (void)enforceDesiredDeviceOrientationWithOrientationMask:(UIInterfaceOrientationMask)orientationMask
{
  // if current sreen orientation isn't part of the mask, we have to change orientation for default one included in mask, in order up-left-right-down
  if (![EXScreenOrientationUtilities doesOrientationMask:orientationMask containOrientation:_currentScreenOrientation]) {
    __block UIInterfaceOrientation newOrientation = [EXScreenOrientationUtilities defaultOrientationForOrientationMask:orientationMask];
    if (newOrientation != UIInterfaceOrientationUnknown) {
      UM_WEAKIFY(self);
      dispatch_async(dispatch_get_main_queue(), ^{
        UM_STRONGIFY(self);
        self.currentScreenOrientation = newOrientation;
        [[UIDevice currentDevice] setValue:@(newOrientation) forKey:@"orientation"];
        [UIViewController attemptRotationToDeviceOrientation];
      
        // screen orientation changed so we send event (notification isn't triggered when manually changing orienatation)
        [self handleScreenOrientationChange];
      });
    }
  }
}

@end
