// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI42_0_0EXAppState.h"
#import "ABI42_0_0EXScopedModuleRegistry.h"

#import <ABI42_0_0UMCore/ABI42_0_0UMAppLifecycleService.h>
#import <ABI42_0_0UMReactNativeAdapter/ABI42_0_0UMModuleRegistryHolderReactModule.h>
#import <ABI42_0_0React/ABI42_0_0RCTAssert.h>
#import <ABI42_0_0React/ABI42_0_0RCTBridge.h>
#import <ABI42_0_0React/ABI42_0_0RCTEventDispatcher.h>
#import <ABI42_0_0React/ABI42_0_0RCTUtils.h>

@interface ABI42_0_0EXAppState ()

@property (nonatomic, assign) BOOL isObserving;

@end

@implementation ABI42_0_0EXAppState

+ (NSString *)moduleName { return @"ABI42_0_0RCTAppState"; }

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
    // TODO: just make ABI42_0_0EXAppState a universal module implementing ABI42_0_0UMAppLifecycleService
    id<ABI42_0_0UMAppLifecycleService> lifeCycleManager = [[[self.bridge moduleForClass:[ABI42_0_0UMModuleRegistryHolderReactModule class]] umModuleRegistry] getModuleImplementingProtocol:@protocol(ABI42_0_0UMAppLifecycleService)];
    if ([state isEqualToString:@"background"]) {
      [lifeCycleManager setAppStateToBackground];
    } else if ([state isEqualToString:@"active"]) {
      [lifeCycleManager setAppStateToForeground];
    }
  }
}

ABI42_0_0RCT_EXPORT_METHOD(getCurrentAppState:(ABI42_0_0RCTResponseSenderBlock)callback
                  error:(__unused ABI42_0_0RCTResponseSenderBlock)error)
{
  callback(@[@{@"app_state": _lastKnownState}]);
}

@end
