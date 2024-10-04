// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI42_0_0EXBattery/ABI42_0_0EXBattery.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMUtilities.h>

@interface ABI42_0_0EXBattery ()

@property (nonatomic, weak) ABI42_0_0UMModuleRegistry *moduleRegistry;
@property (nonatomic, weak) id <ABI42_0_0UMEventEmitterService> eventEmitter;
@property (nonatomic, assign) BOOL hasListeners;
@property (nonatomic, readonly) ABI42_0_0EXBatteryState batteryState;

@end

@implementation ABI42_0_0EXBattery

ABI42_0_0UM_EXPORT_MODULE(ExpoBattery);

- (NSDictionary *)constantsToExport
{
  BOOL _isSupported = YES;
  
  #if TARGET_OS_SIMULATOR
    _isSupported = NO;
  #endif
  
  return @{ @"isSupported": @(_isSupported) };
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (void)setModuleRegistry:(ABI42_0_0UMModuleRegistry *)moduleRegistry
{
  if (_moduleRegistry) {
    [self invalidate];
  }
  _moduleRegistry = moduleRegistry;
  _eventEmitter = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI42_0_0UMEventEmitterService)];
  
  if (moduleRegistry) {
    UIDevice.currentDevice.batteryMonitoringEnabled = YES;
  }
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"Expo.batteryLevelDidChange", @"Expo.batteryStateDidChange", @"Expo.powerModeDidChange"];
}

- (void)startObserving
{
  _hasListeners = YES;
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(batteryLevelDidChange:)
                                               name:UIDeviceBatteryLevelDidChangeNotification
                                             object:nil];
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(batteryStateDidChange:)
                                               name:UIDeviceBatteryStateDidChangeNotification
                                             object:nil];
  
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(powerModeDidChange:)
                                               name:NSProcessInfoPowerStateDidChangeNotification
                                             object:nil];
  
}

- (void)stopObserving
{
  _hasListeners = NO;
  [[NSNotificationCenter defaultCenter] removeObserver:self
                                                  name:UIDeviceBatteryLevelDidChangeNotification
                                                object:nil];
  [[NSNotificationCenter defaultCenter] removeObserver:self
                                                  name:UIDeviceBatteryStateDidChangeNotification
                                                object:nil];
  [[NSNotificationCenter defaultCenter] removeObserver:self
                                                  name:NSProcessInfoPowerStateDidChangeNotification
                                                object:nil];
}

- (void)invalidate
{
  _eventEmitter = nil;
  UIDevice.currentDevice.batteryMonitoringEnabled = NO;
}

// Called at most once every minute
- (void)batteryLevelDidChange:(NSNotification *)notification
{
  if (!_hasListeners) {
    return;
  }
  NSDictionary *result = @{@"batteryLevel": @(UIDevice.currentDevice.batteryLevel)};
  [_eventEmitter sendEventWithName:@"Expo.batteryLevelDidChange" body:result];
}

- (void)batteryStateDidChange:(NSNotification *)notification
{
  if (!_hasListeners) {
    return;
  }
  NSDictionary *result = @{@"batteryState": @(self.batteryState)};
  [_eventEmitter sendEventWithName:@"Expo.batteryStateDidChange" body:result];
}


- (void)powerModeDidChange:(NSNotification *)notification
{
  if(!_hasListeners) {
    return;
  }
  NSDictionary *result = @{@"lowPowerMode": @(NSProcessInfo.processInfo.isLowPowerModeEnabled)};
  [_eventEmitter sendEventWithName:@"Expo.powerModeDidChange" body:result];
}

ABI42_0_0UM_EXPORT_METHOD_AS(getBatteryLevelAsync,
                    getBatteryLevelAsyncWithResolver:(ABI42_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI42_0_0UMPromiseRejectBlock)reject)
{
  resolve(@(UIDevice.currentDevice.batteryLevel));
}

ABI42_0_0UM_EXPORT_METHOD_AS(getBatteryStateAsync,
                    getBatteryStateAsyncWithResolver:(ABI42_0_0UMPromiseResolveBlock)resolve rejecter:(ABI42_0_0UMPromiseRejectBlock)reject)
{
  resolve(@([self batteryState]));
}

ABI42_0_0UM_EXPORT_METHOD_AS(isLowPowerModeEnabledAsync,
                    isLowPowerModeEnabledAsyncWithResolver:(ABI42_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI42_0_0UMPromiseRejectBlock)reject)
{
  resolve(@(NSProcessInfo.processInfo.isLowPowerModeEnabled));
}

- (ABI42_0_0EXBatteryState)batteryState
{
  switch (UIDevice.currentDevice.batteryState) {
    case UIDeviceBatteryStateUnknown:
      return ABI42_0_0EXBatteryStateUnknown;
    case UIDeviceBatteryStateUnplugged:
      return ABI42_0_0EXBatteryStateUnplugged;
    case UIDeviceBatteryStateCharging:
      return ABI42_0_0EXBatteryStateCharging;
    case UIDeviceBatteryStateFull:
      return ABI42_0_0EXBatteryStateFull;
    default:
      return ABI42_0_0EXBatteryStateUnknown;
  }
}

@end
