// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI42_0_0EXSensors/ABI42_0_0EXPedometer.h>
#import <ABI42_0_0EXSensors/ABI42_0_0EXMotionPermissionRequester.h>
#import <CoreMotion/CoreMotion.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMModuleRegistry.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMAppLifecycleService.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMEventEmitterService.h>
#import <ABI42_0_0ExpoModulesCore/ABI42_0_0EXPermissionsInterface.h>
#import <ABI42_0_0ExpoModulesCore/ABI42_0_0EXPermissionsMethodsDelegate.h>

NSString * const ABI42_0_0EXPedometerUpdateEventName = @"Exponent.pedometerUpdate";
NSString * const ABI42_0_0EXPedometerModuleName = @"ExponentPedometer";

@interface ABI42_0_0EXPedometer () <ABI42_0_0UMAppLifecycleListener>

@property (nonatomic, assign) BOOL isWatching;
@property (nonatomic, strong) NSDate *watchStartDate;
@property (nonatomic, strong) CMPedometer *pedometer;
@property (nonatomic, copy) CMPedometerHandler watchHandler;

@property (nonatomic, weak) id<ABI42_0_0UMEventEmitterService> eventEmitter;
@property (nonatomic, weak) id<ABI42_0_0UMAppLifecycleService> lifecycleManager;
@property (nonatomic, weak) id<ABI42_0_0EXPermissionsInterface> permissionsManager;

@end

@implementation ABI42_0_0EXPedometer

# pragma mark - Object lifecycle

- (instancetype)init
{
  if (self = [super init]) {
    __weak ABI42_0_0EXPedometer *weakSelf = self;
    _watchHandler = ^(CMPedometerData * _Nullable pedometerData, NSError * _Nullable error) {
      if (error) {
        // TODO: Handle errors
        return;
      }
      
      __strong ABI42_0_0EXPedometer *strongSelf = weakSelf;
      if (strongSelf) {
        __strong id<ABI42_0_0UMEventEmitterService> eventEmitter = strongSelf.eventEmitter;
        if (eventEmitter) {
          [eventEmitter sendEventWithName:ABI42_0_0EXPedometerUpdateEventName
                                     body:@{@"steps": pedometerData.numberOfSteps}];
        }
      }
    };
  }
  return self;
}

# pragma mark - ABI42_0_0UMModuleRegistryConsumer

- (void)setModuleRegistry:(ABI42_0_0UMModuleRegistry *)moduleRegistry
{
  if (_lifecycleManager) {
    [_lifecycleManager unregisterAppLifecycleListener:self];
  }

  _isWatching = NO;
  _eventEmitter = nil;
  _lifecycleManager = nil;
  [self stopObserving];
  
  if (moduleRegistry) {
    _eventEmitter = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI42_0_0UMEventEmitterService)];
    _lifecycleManager = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI42_0_0UMAppLifecycleService)];
    _permissionsManager = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI42_0_0EXPermissionsInterface)];
  }

  [ABI42_0_0EXPermissionsMethodsDelegate registerRequesters:@[[ABI42_0_0EXMotionPermissionRequester new]] withPermissionsManager:_permissionsManager];
  
  if (_lifecycleManager) {
    [_lifecycleManager registerAppLifecycleListener:self];
  }
}

- (CMPedometer *)getPedometerInstance
{
  if (_pedometer) {
    return _pedometer;
  }
  
  _pedometer = [CMPedometer new];
  return _pedometer;
}

# pragma mark - Expo module

ABI42_0_0UM_REGISTER_MODULE();

+ (const NSString *)exportedModuleName
{
  return ABI42_0_0EXPedometerModuleName;
}

# pragma mark - ABI42_0_0UMEventEmitter

- (NSArray<NSString *> *)supportedEvents
{
  return @[ABI42_0_0EXPedometerUpdateEventName];
}

- (void)startObserving {
  CMPedometer *pedometer = [self getPedometerInstance];

  // Restart observing
  [self stopObserving];

  _isWatching = YES;
  _watchStartDate = [NSDate date];
  
  [pedometer startPedometerUpdatesFromDate:_watchStartDate withHandler:_watchHandler];
}


- (void)stopObserving
{
  if (_isWatching) {
    CMPedometer *pedometer = [self getPedometerInstance];
    [pedometer stopPedometerUpdates];
  }
  _watchStartDate = nil;
  _isWatching = NO;
}

# pragma mark - Client code API

ABI42_0_0UM_EXPORT_METHOD_AS(getStepCountAsync,
                    getStepCountAsync:(nonnull NSNumber *)startTime
                    endTime:(nonnull NSNumber *)endTime
                    resolver:(ABI42_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI42_0_0UMPromiseRejectBlock)reject)
{
  CMPedometer *pedometer = [self getPedometerInstance];
  
  NSDate *startDate = [NSDate dateWithTimeIntervalSince1970:startTime.doubleValue / 1000];
  NSDate *endDate = [NSDate dateWithTimeIntervalSince1970:endTime.doubleValue / 1000];
  [pedometer queryPedometerDataFromDate:startDate toDate:endDate withHandler:^(CMPedometerData * _Nullable pedometerData, NSError * _Nullable error) {
    if (error) {
      reject(@"E_PEDOMETER", @"An error occured while querying pedometer data.", error);
      return;
    }
    
    resolve(@{@"steps": pedometerData.numberOfSteps});
  }];
}

ABI42_0_0UM_EXPORT_METHOD_AS(isAvailableAsync, isAvailableAsync:(ABI42_0_0UMPromiseResolveBlock)resolve rejecter:(ABI42_0_0UMPromiseRejectBlock)reject)
{
  resolve(@([CMPedometer isStepCountingAvailable]));
}


ABI42_0_0UM_EXPORT_METHOD_AS(getPermissionsAsync,
                    getPermissionsAsync:(ABI42_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI42_0_0UMPromiseRejectBlock)reject)
{
  [ABI42_0_0EXPermissionsMethodsDelegate getPermissionWithPermissionsManager:_permissionsManager
                                                      withRequester:[ABI42_0_0EXMotionPermissionRequester class]
                                                            resolve:resolve
                                                             reject:reject];
}

ABI42_0_0UM_EXPORT_METHOD_AS(requestPermissionsAsync,
                    requestPermissionsAsync:(ABI42_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI42_0_0UMPromiseRejectBlock)reject)
{
  [ABI42_0_0EXPermissionsMethodsDelegate askForPermissionWithPermissionsManager:_permissionsManager
                                                         withRequester:[ABI42_0_0EXMotionPermissionRequester class]
                                                               resolve:resolve
                                                                reject:reject];
}


# pragma mark - ABI42_0_0UMAppLifecycleListener

- (void)onAppBackgrounded {
  if (_isWatching) {
    CMPedometer *pedometer = [self getPedometerInstance];
    [pedometer stopPedometerUpdates];
  }
}

- (void)onAppForegrounded {
  if (_isWatching) {
    CMPedometer *pedometer = [self getPedometerInstance];
    [pedometer startPedometerUpdatesFromDate:_watchStartDate withHandler:_watchHandler];
  }
}

@end
