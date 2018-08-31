// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI30_0_0EXSensors/ABI30_0_0EXPedometer.h>
#import <CoreMotion/CoreMotion.h>
#import <ABI30_0_0EXCore/ABI30_0_0EXModuleRegistry.h>
#import <ABI30_0_0EXCore/ABI30_0_0EXAppLifecycleService.h>
#import <ABI30_0_0EXCore/ABI30_0_0EXEventEmitterService.h>

NSString * const ABI30_0_0EXPedometerUpdateEventName = @"Exponent.pedometerUpdate";
NSString * const ABI30_0_0EXPedometerModuleName = @"ExponentPedometer";

@interface ABI30_0_0EXPedometer () <ABI30_0_0EXAppLifecycleListener>

@property (nonatomic, assign) BOOL isWatching;
@property (nonatomic, strong) NSDate *watchStartDate;
@property (nonatomic, strong) CMPedometer *pedometer;
@property (nonatomic, copy) CMPedometerHandler watchHandler;

@property (nonatomic, weak) id<ABI30_0_0EXEventEmitterService> eventEmitter;
@property (nonatomic, weak) id<ABI30_0_0EXAppLifecycleService> lifecycleManager;

@end

@implementation ABI30_0_0EXPedometer

# pragma mark - Object lifecycle

- (instancetype)init
{
  if (self = [super init]) {
    __weak ABI30_0_0EXPedometer *weakSelf = self;
    _watchHandler = ^(CMPedometerData * _Nullable pedometerData, NSError * _Nullable error) {
      if (error) {
        // TODO: Handle errors
        return;
      }
      
      __strong ABI30_0_0EXPedometer *strongSelf = weakSelf;
      if (strongSelf) {
        __strong id<ABI30_0_0EXEventEmitterService> eventEmitter = strongSelf.eventEmitter;
        if (eventEmitter) {
          [eventEmitter sendEventWithName:ABI30_0_0EXPedometerUpdateEventName
                                     body:@{@"steps": pedometerData.numberOfSteps}];
        }
      }
    };
  }
  return self;
}

# pragma mark - ABI30_0_0EXModuleRegistryConsumer

- (void)setModuleRegistry:(ABI30_0_0EXModuleRegistry *)moduleRegistry
{
  if (_lifecycleManager) {
    [_lifecycleManager unregisterAppLifecycleListener:self];
  }

  _isWatching = NO;
  _eventEmitter = nil;
  _lifecycleManager = nil;
  [self stopObserving];
  
  if (moduleRegistry) {
    _eventEmitter = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI30_0_0EXEventEmitterService)];
    _lifecycleManager = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI30_0_0EXAppLifecycleService)];
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

ABI30_0_0EX_REGISTER_MODULE();

+ (const NSString *)exportedModuleName
{
  return ABI30_0_0EXPedometerModuleName;
}

# pragma mark - ABI30_0_0EXEventEmitter

- (NSArray<NSString *> *)supportedEvents
{
  return @[ABI30_0_0EXPedometerUpdateEventName];
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

ABI30_0_0EX_EXPORT_METHOD_AS(getStepCountAsync,
                    getStepCountAsync:(nonnull NSNumber *)startTime
                    endTime:(nonnull NSNumber *)endTime
                    resolver:(ABI30_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI30_0_0EXPromiseRejectBlock)reject)
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

ABI30_0_0EX_EXPORT_METHOD_AS(isAvailableAsync, isAvailableAsync:(ABI30_0_0EXPromiseResolveBlock)resolve rejecter:(ABI30_0_0EXPromiseRejectBlock)reject)
{
  resolve(@([CMPedometer isStepCountingAvailable]));
}

# pragma mark - ABI30_0_0EXAppLifecycleListener

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
