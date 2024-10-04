// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI47_0_0EXAppState.h"
#import "ABI47_0_0EXScopedModuleRegistry.h"

#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXAppLifecycleService.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXModuleRegistryHolderReactModule.h>

#import <ABI47_0_0React/ABI47_0_0RCTAssert.h>
#import <ABI47_0_0React/ABI47_0_0RCTBridge.h>
#import <ABI47_0_0React/ABI47_0_0RCTEventDispatcher.h>
#import <ABI47_0_0React/ABI47_0_0RCTUtils.h>

@interface ABI47_0_0EXAppState ()

@property (nonatomic, assign) BOOL isObserving;

@end

@implementation ABI47_0_0EXAppState

+ (NSString *)moduleName { return @"ABI47_0_0RCTAppState"; }

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
    // TODO: just make ABI47_0_0EXAppState an expo module implementing ABI47_0_0EXAppLifecycleService
    id<ABI47_0_0EXAppLifecycleService> lifeCycleManager = [[[self.bridge moduleForClass:[ABI47_0_0EXModuleRegistryHolderReactModule class]] exModuleRegistry] getModuleImplementingProtocol:@protocol(ABI47_0_0EXAppLifecycleService)];
    if ([state isEqualToString:@"background"]) {
      [lifeCycleManager setAppStateToBackground];
    } else if ([state isEqualToString:@"active"]) {
      [lifeCycleManager setAppStateToForeground];
    }
  }
}

ABI47_0_0RCT_EXPORT_METHOD(getCurrentAppState:(ABI47_0_0RCTResponseSenderBlock)callback
                  error:(__unused ABI47_0_0RCTResponseSenderBlock)error)
{
  callback(@[@{@"app_state": _lastKnownState}]);
}

@end
