// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI48_0_0EXAppState.h"
#import "ABI48_0_0EXScopedModuleRegistry.h"

#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXAppLifecycleService.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXModuleRegistryHolderReactModule.h>

#import <ABI48_0_0React/ABI48_0_0RCTAssert.h>
#import <ABI48_0_0React/ABI48_0_0RCTBridge.h>
#import <ABI48_0_0React/ABI48_0_0RCTEventDispatcher.h>
#import <ABI48_0_0React/ABI48_0_0RCTUtils.h>

@interface ABI48_0_0EXAppState ()

@property (nonatomic, assign) BOOL isObserving;

@end

@implementation ABI48_0_0EXAppState

+ (NSString *)moduleName { return @"ABI48_0_0RCTAppState"; }

- (instancetype)init
{
  if (self = [super init]) {
    _lastKnownState = @"active";
  }
  return self;
}

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (NSDictionary *)constantsToExport
{
  return @{@"initialAppState": @"active"};
}

#pragma mark - Lifecycle

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"appStateDidChange", @"memoryWarning"];
}

- (void)startObserving
{
  _isObserving = YES;
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleMemoryWarning)
                                               name:UIApplicationDidReceiveMemoryWarningNotification
                                             object:nil];
}

- (void)stopObserving
{
  _isObserving = NO;
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

#pragma mark - App Notification Methods

- (void)handleMemoryWarning
{
  [self sendEventWithName:@"memoryWarning" body:nil];
}

- (void)setState:(NSString *)state
{
  if (![state isEqualToString:_lastKnownState]) {
    _lastKnownState = state;
    if (_isObserving) {
      [self sendEventWithName:@"appStateDidChange"
                         body:@{@"app_state": _lastKnownState}];
    }
   
    // change state on universal modules
    // TODO: just make ABI48_0_0EXAppState an expo module implementing ABI48_0_0EXAppLifecycleService
    id<ABI48_0_0EXAppLifecycleService> lifeCycleManager = [[[self.bridge moduleForClass:[ABI48_0_0EXModuleRegistryHolderReactModule class]] exModuleRegistry] getModuleImplementingProtocol:@protocol(ABI48_0_0EXAppLifecycleService)];
    if ([state isEqualToString:@"background"]) {
      [lifeCycleManager setAppStateToBackground];
    } else if ([state isEqualToString:@"active"]) {
      [lifeCycleManager setAppStateToForeground];
    }
  }
}

ABI48_0_0RCT_EXPORT_METHOD(getCurrentAppState:(ABI48_0_0RCTResponseSenderBlock)callback
                  error:(__unused ABI48_0_0RCTResponseSenderBlock)error)
{
  callback(@[@{@"app_state": _lastKnownState}]);
}

@end
