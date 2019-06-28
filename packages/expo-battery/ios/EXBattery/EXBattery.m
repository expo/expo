// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXBattery/EXBattery.h>
#import <UMCore/UMUtilities.h>

@interface EXBattery ()

@property (nonatomic, weak) UMModuleRegistry *moduleRegistry;
@property (nonatomic, weak) id <UMEventEmitterService> eventEmitter;
@property (nonatomic, assign) BOOL hasListeners;

@end

@implementation EXBattery

UM_EXPORT_MODULE(ExpoBattery);

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (void)setModuleRegistry:(UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
  _eventEmitter = [moduleRegistry getModuleImplementingProtocol:@protocol(UMEventEmitterService)];
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"Expo.batteryLevelDidChange", @"Expo.batteryStateDidChange", @"Expo.powerModeDidChange"];
}

- (void)startObserving {
  _hasListeners = YES;
}

- (void)stopObserving {
  _hasListeners = NO;
}

- (id)init
{
  if ((self = [super init])) {
    [UIDevice.currentDevice setBatteryMonitoringEnabled:YES];
    
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
  
  return self;
}

- (void)dealloc {
  [self invalidate];
}

- (void)invalidate {
  _eventEmitter = nil;
  [UIDevice currentDevice].batteryMonitoringEnabled = NO;
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

// Called at most once every minute
- (void)batteryLevelDidChange:(NSNotification *)notification
{
  NSLog(@"batteryLevelDidChange was called");
  if (!_hasListeners) {
    NSLog(@"and hasListeners was false");
    return;
  }
  
  float batteryLevel = [[self getPowerState][@"batteryLevel"] floatValue];
  [_eventEmitter sendEventWithName:@"Expo.batteryLevelDidChange" body:@(batteryLevel)];
}

- (void)batteryStateDidChange:(NSNotification *)notification
{
  NSLog(@"batteryStateDidChange was called");
  if (!_hasListeners) {
    NSLog(@"and hasListeners was false");
    return;
  }
  
  [_eventEmitter sendEventWithName:@"Expo.batteryStateDidChange" body:[self getPowerState][@"batteryState"]];
}

+ (NSString *)valueForIsLowPowerModeEnabled:(BOOL)isLowPowerModeEnabled
{
  return isLowPowerModeEnabled ? @"on" : @"off";
}

- (void)powerModeDidChange:(NSNotification *)notification
{
  if(!_hasListeners) {
    return;
  }
  
  [_eventEmitter sendEventWithName:@"Expo.powerModeDidChange" body:[EXBattery.class valueForIsLowPowerModeEnabled: NSProcessInfo.processInfo.isLowPowerModeEnabled]];
}


- (NSDictionary *)getPowerState
{
#if RCT_DEV && (!TARGET_IPHONE_SIMULATOR) && !TARGET_OS_TV
  if ([UIDevice currentDevice].isBatteryMonitoringEnabled != YES) {
    RCTLogWarn(@"Battery monitoring is not enabled. "
               "You need to enable monitoring with `[UIDevice currentDevice].batteryMonitoringEnabled = TRUE`");
  }
#endif
#if RCT_DEV && TARGET_IPHONE_SIMULATOR && !TARGET_OS_TV
  if ([UIDevice currentDevice].batteryState == UIDeviceBatteryStateUnknown) {
    RCTLogWarn(@"Battery state `unknown` and monitoring disabled, this is normal for simulators and tvOS.");
  }
#endif
  
  NSArray *batteryStates = @[@"unknown", @"unplugged", @"charging", @"full"];
  __block NSDictionary *powerState;
  
  [UMUtilities performSynchronouslyOnMainThread:^{
    powerState = @{
                   @"batteryLevel": @([UIDevice currentDevice].batteryLevel),
                   @"batteryState": batteryStates[[UIDevice currentDevice].batteryState],
                   @"lowPowerMode": NSProcessInfo.processInfo.isLowPowerModeEnabled ? @"on" : @"off"
                   };
  }];
  return powerState;
}

UM_EXPORT_METHOD_AS(getPowerStateAsync,
                    getPowerStateAsyncWithResolver:(UMPromiseResolveBlock)resolve rejecter:(UMPromiseRejectBlock)reject)
{
  resolve([self getPowerState]);
}

UM_EXPORT_METHOD_AS(getBatteryLevelAsync,
                    getBatteryLevelAsyncWithResolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  resolve(@([[self getPowerState][@"batteryLevel"] floatValue]));
}

UM_EXPORT_METHOD_AS(getBatteryStateAsync,
                    getBatteryStateAsyncWithResolver:(UMPromiseResolveBlock)resolve rejecter:(UMPromiseRejectBlock)reject)
{
  resolve([self getPowerState][@"batteryState"]);
}



UM_EXPORT_METHOD_AS(someGreatMethodAsync,
                    options:(NSDictionary *)options
                    resolve:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
{
}

- (NSDictionary *)constantsToExport
{
  return @{};
}


@end
