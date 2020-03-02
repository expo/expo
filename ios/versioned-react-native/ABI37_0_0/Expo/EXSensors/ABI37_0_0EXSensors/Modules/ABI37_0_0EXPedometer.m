// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI37_0_0EXSensors/ABI37_0_0EXPedometer.h>
#import <CoreMotion/CoreMotion.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMModuleRegistry.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMAppLifecycleService.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMEventEmitterService.h>

NSString * const ABI37_0_0EXPedometerUpdateEventName = @"Exponent.pedometerUpdate";
NSString * const ABI37_0_0EXPedometerModuleName = @"ExponentPedometer";

@interface ABI37_0_0EXPedometer () <ABI37_0_0UMAppLifecycleListener>

@property (nonatomic, assign) BOOL isWatching;
@property (nonatomic, strong) NSDate *watchStartDate;
@property (nonatomic, strong) CMPedometer *pedometer;
@property (nonatomic, copy) CMPedometerHandler watchHandler;

@property (nonatomic, weak) id<ABI37_0_0UMEventEmitterService> eventEmitter;
@property (nonatomic, weak) id<ABI37_0_0UMAppLifecycleService> lifecycleManager;

@end

@implementation ABI37_0_0EXPedometer

# pragma mark - Object lifecycle

- (instancetype)init
{
  if (self = [super init]) {
    __weak ABI37_0_0EXPedometer *weakSelf = self;
    _watchHandler = ^(CMPedometerData * _Nullable pedometerData, NSError * _Nullable error) {
      if (error) {
        // TODO: Handle errors
        return;
      }
      
      __strong ABI37_0_0EXPedometer *strongSelf = weakSelf;
      if (strongSelf) {
        __strong id<ABI37_0_0UMEventEmitterService> eventEmitter = strongSelf.eventEmitter;
        if (eventEmitter) {
          [eventEmitter sendEventWithName:ABI37_0_0EXPedometerUpdateEventName
                                     body:@{@"steps": pedometerData.numberOfSteps}];
        }
      }
    };
  }
  return self;
}

# pragma mark - ABI37_0_0UMModuleRegistryConsumer

- (void)setModuleRegistry:(ABI37_0_0UMModuleRegistry *)moduleRegistry
{
  if (_lifecycleManager) {
    [_lifecycleManager unregisterAppLifecycleListener:self];
  }

  _isWatching = NO;
  _eventEmitter = nil;
  _lifecycleManager = nil;
  [self stopObserving];
  
  if (moduleRegistry) {
    _eventEmitter = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI37_0_0UMEventEmitterService)];
    _lifecycleManager = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI37_0_0UMAppLifecycleService)];
  }
  
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

ABI37_0_0UM_REGISTER_MODULE();

+ (const NSString *)exportedModuleName
{
  return ABI37_0_0EXPedometerModuleName;
}

# pragma mark - ABI37_0_0UMEventEmitter

- (NSArray<NSString *> *)supportedEvents
{
  return @[ABI37_0_0EXPedometerUpdateEventName];
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

ABI37_0_0UM_EXPORT_METHOD_AS(getStepCountAsync,
                    getStepCountAsync:(nonnull NSNumber *)startTime
                    endTime:(nonnull NSNumber *)endTime
                    resolver:(ABI37_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI37_0_0UMPromiseRejectBlock)reject)
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

ABI37_0_0UM_EXPORT_METHOD_AS(isAvailableAsync, isAvailableAsync:(ABI37_0_0UMPromiseResolveBlock)resolve rejecter:(ABI37_0_0UMPromiseRejectBlock)reject)
{
  resolve(@([CMPedometer isStepCountingAvailable]));
}

# pragma mark - ABI37_0_0UMAppLifecycleListener

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
