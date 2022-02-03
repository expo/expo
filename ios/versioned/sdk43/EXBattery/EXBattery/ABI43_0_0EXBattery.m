// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI43_0_0EXBattery/ABI43_0_0EXBattery.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXUtilities.h>

@interface ABI43_0_0EXBattery ()

@property (nonatomic, weak) ABI43_0_0EXModuleRegistry *moduleRegistry;
@property (nonatomic, weak) id <ABI43_0_0EXEventEmitterService> eventEmitter;
@property (nonatomic, assign) BOOL hasListeners;
@property (nonatomic, readonly) ABI43_0_0EXBatteryState batteryState;

@end

@implementation ABI43_0_0EXBattery

ABI43_0_0EX_EXPORT_MODULE(ExpoBattery);

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

- (void)setModuleRegistry:(ABI43_0_0EXModuleRegistry *)moduleRegistry
{
  if (_moduleRegistry) {
    [self invalidate];
  }
  _moduleRegistry = moduleRegistry;
  _eventEmitter = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI43_0_0EXEventEmitterService)];
  
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

ABI43_0_0EX_EXPORT_METHOD_AS(getBatteryLevelAsync,
                    getBatteryLevelAsyncWithResolver:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  resolve(@(UIDevice.currentDevice.batteryLevel));
}

ABI43_0_0EX_EXPORT_METHOD_AS(getBatteryStateAsync,
                    getBatteryStateAsyncWithResolver:(ABI43_0_0EXPromiseResolveBlock)resolve rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  resolve(@([self batteryState]));
}

ABI43_0_0EX_EXPORT_METHOD_AS(isLowPowerModeEnabledAsync,
                    isLowPowerModeEnabledAsyncWithResolver:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  resolve(@(NSProcessInfo.processInfo.isLowPowerModeEnabled));
}

- (ABI43_0_0EXBatteryState)batteryState
{
  switch (UIDevice.currentDevice.batteryState) {
    case UIDeviceBatteryStateUnknown:
      return ABI43_0_0EXBatteryStateUnknown;
    case UIDeviceBatteryStateUnplugged:
      return ABI43_0_0EXBatteryStateUnplugged;
    case UIDeviceBatteryStateCharging:
      return ABI43_0_0EXBatteryStateCharging;
    case UIDeviceBatteryStateFull:
      return ABI43_0_0EXBatteryStateFull;
    default:
      return ABI43_0_0EXBatteryStateUnknown;
  }
}

@end
