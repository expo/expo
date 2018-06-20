// Copyright 2015-present 650 Industries. All rights reserved.

#import <EXSensors/EXPedometer.h>
#import <CoreMotion/CoreMotion.h>
#import <EXCore/EXModuleRegistry.h>
#import <EXCore/EXAppLifecycleService.h>
#import <EXCore/EXEventEmitterService.h>

NSString * const EXPedometerUpdateEventName = @"Exponent.pedometerUpdate";
NSString * const EXPedometerModuleName = @"ExponentPedometer";

@interface EXPedometer () <EXAppLifecycleListener>

@property (nonatomic, assign) BOOL isWatching;
@property (nonatomic, strong) NSDate *watchStartDate;
@property (nonatomic, strong) CMPedometer *pedometer;
@property (nonatomic, copy) CMPedometerHandler watchHandler;

@property (nonatomic, weak) id<EXEventEmitterService> eventEmitter;
@property (nonatomic, weak) id<EXAppLifecycleService> lifecycleManager;

@end

@implementation EXPedometer

# pragma mark - Object lifecycle

- (instancetype)init
{
  if (self = [super init]) {
    __weak EXPedometer *weakSelf = self;
    _watchHandler = ^(CMPedometerData * _Nullable pedometerData, NSError * _Nullable error) {
      if (error) {
        // TODO: Handle errors
        return;
      }
      
      __strong EXPedometer *strongSelf = weakSelf;
      if (strongSelf) {
        __strong id<EXEventEmitterService> eventEmitter = strongSelf.eventEmitter;
        if (eventEmitter) {
          [eventEmitter sendEventWithName:EXPedometerUpdateEventName
                                     body:@{@"steps": pedometerData.numberOfSteps}];
        }
      }
    };
  }
  return self;
}

# pragma mark - EXModuleRegistryConsumer

- (void)setModuleRegistry:(EXModuleRegistry *)moduleRegistry
{
  if (_lifecycleManager) {
    [_lifecycleManager unregisterAppLifecycleListener:self];
  }

  _isWatching = NO;
  _eventEmitter = nil;
  _lifecycleManager = nil;
  [self stopObserving];
  
  if (moduleRegistry) {
    _eventEmitter = [moduleRegistry getModuleImplementingProtocol:@protocol(EXEventEmitterService)];
    _lifecycleManager = [moduleRegistry getModuleImplementingProtocol:@protocol(EXAppLifecycleService)];
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

EX_REGISTER_MODULE();

+ (const NSString *)exportedModuleName
{
  return EXPedometerModuleName;
}

# pragma mark - EXEventEmitter

- (NSArray<NSString *> *)supportedEvents
{
  return @[EXPedometerUpdateEventName];
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

EX_EXPORT_METHOD_AS(getStepCountAsync,
                    getStepCountAsync:(nonnull NSNumber *)startTime
                    endTime:(nonnull NSNumber *)endTime
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
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

EX_EXPORT_METHOD_AS(isAvailableAsync, isAvailableAsync:(EXPromiseResolveBlock)resolve rejecter:(EXPromiseRejectBlock)reject)
{
  resolve(@([CMPedometer isStepCountingAvailable]));
}

# pragma mark - EXAppLifecycleListener

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
