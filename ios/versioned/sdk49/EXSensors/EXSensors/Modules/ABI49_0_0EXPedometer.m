// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI49_0_0EXSensors/ABI49_0_0EXPedometer.h>
#import <ABI49_0_0EXSensors/ABI49_0_0EXMotionPermissionRequester.h>
#import <CoreMotion/CoreMotion.h>
#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXModuleRegistry.h>
#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXAppLifecycleService.h>
#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXEventEmitterService.h>
#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXPermissionsInterface.h>
#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXPermissionsMethodsDelegate.h>

NSString * const ABI49_0_0EXPedometerUpdateEventName = @"Exponent.pedometerUpdate";
NSString * const ABI49_0_0EXPedometerModuleName = @"ExponentPedometer";

@interface ABI49_0_0EXPedometer () <ABI49_0_0EXAppLifecycleListener>

@property (nonatomic, assign) BOOL isWatching;
@property (nonatomic, strong) NSDate *watchStartDate;
@property (nonatomic, strong) CMPedometer *pedometer;
@property (nonatomic, copy) CMPedometerHandler watchHandler;

@property (nonatomic, weak) id<ABI49_0_0EXEventEmitterService> eventEmitter;
@property (nonatomic, weak) id<ABI49_0_0EXAppLifecycleService> lifecycleManager;
@property (nonatomic, weak) id<ABI49_0_0EXPermissionsInterface> permissionsManager;

@end

@implementation ABI49_0_0EXPedometer

# pragma mark - Object lifecycle

- (instancetype)init
{
  if (self = [super init]) {
    __weak ABI49_0_0EXPedometer *weakSelf = self;
    _watchHandler = ^(CMPedometerData * _Nullable pedometerData, NSError * _Nullable error) {
      if (error) {
        // TODO: Handle errors
        return;
      }
      
      __strong ABI49_0_0EXPedometer *strongSelf = weakSelf;
      if (strongSelf) {
        __strong id<ABI49_0_0EXEventEmitterService> eventEmitter = strongSelf.eventEmitter;
        if (eventEmitter) {
          [eventEmitter sendEventWithName:ABI49_0_0EXPedometerUpdateEventName
                                     body:@{@"steps": pedometerData.numberOfSteps}];
        }
      }
    };
  }
  return self;
}

# pragma mark - ABI49_0_0EXModuleRegistryConsumer

- (void)setModuleRegistry:(ABI49_0_0EXModuleRegistry *)moduleRegistry
{
  if (_lifecycleManager) {
    [_lifecycleManager unregisterAppLifecycleListener:self];
  }

  _isWatching = NO;
  _eventEmitter = nil;
  _lifecycleManager = nil;
  [self stopObserving];
  
  if (moduleRegistry) {
    _eventEmitter = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI49_0_0EXEventEmitterService)];
    _lifecycleManager = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI49_0_0EXAppLifecycleService)];
    _permissionsManager = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI49_0_0EXPermissionsInterface)];
  }

  [ABI49_0_0EXPermissionsMethodsDelegate registerRequesters:@[[ABI49_0_0EXMotionPermissionRequester new]] withPermissionsManager:_permissionsManager];
  
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

ABI49_0_0EX_REGISTER_MODULE();

+ (const NSString *)exportedModuleName
{
  return ABI49_0_0EXPedometerModuleName;
}

# pragma mark - ABI49_0_0EXEventEmitter

- (NSArray<NSString *> *)supportedEvents
{
  return @[ABI49_0_0EXPedometerUpdateEventName];
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

ABI49_0_0EX_EXPORT_METHOD_AS(getStepCountAsync,
                    getStepCountAsync:(nonnull NSNumber *)startTime
                    endTime:(nonnull NSNumber *)endTime
                    resolver:(ABI49_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI49_0_0EXPromiseRejectBlock)reject)
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

ABI49_0_0EX_EXPORT_METHOD_AS(isAvailableAsync, isAvailableAsync:(ABI49_0_0EXPromiseResolveBlock)resolve rejecter:(ABI49_0_0EXPromiseRejectBlock)reject)
{
  resolve(@([CMPedometer isStepCountingAvailable]));
}


ABI49_0_0EX_EXPORT_METHOD_AS(getPermissionsAsync,
                    getPermissionsAsync:(ABI49_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI49_0_0EXPromiseRejectBlock)reject)
{
  [ABI49_0_0EXPermissionsMethodsDelegate getPermissionWithPermissionsManager:_permissionsManager
                                                      withRequester:[ABI49_0_0EXMotionPermissionRequester class]
                                                            resolve:resolve
                                                             reject:reject];
}

ABI49_0_0EX_EXPORT_METHOD_AS(requestPermissionsAsync,
                    requestPermissionsAsync:(ABI49_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI49_0_0EXPromiseRejectBlock)reject)
{
  [ABI49_0_0EXPermissionsMethodsDelegate askForPermissionWithPermissionsManager:_permissionsManager
                                                         withRequester:[ABI49_0_0EXMotionPermissionRequester class]
                                                               resolve:resolve
                                                                reject:reject];
}


# pragma mark - ABI49_0_0EXAppLifecycleListener

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
