// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI38_0_0EXAppState.h"
#import "ABI38_0_0EXScopedModuleRegistry.h"

#import <ABI38_0_0UMCore/ABI38_0_0UMAppLifecycleService.h>
#import <ABI38_0_0UMReactNativeAdapter/ABI38_0_0UMModuleRegistryHolderReactModule.h>
#import <ABI38_0_0React/ABI38_0_0RCTAssert.h>
#import <ABI38_0_0React/ABI38_0_0RCTBridge.h>
#import <ABI38_0_0React/ABI38_0_0RCTEventDispatcher.h>
#import <ABI38_0_0React/ABI38_0_0RCTUtils.h>

@interface ABI38_0_0EXAppState ()

@property (nonatomic, assign) BOOL isObserving;

@end

@implementation ABI38_0_0EXAppState

+ (NSString *)moduleName { return @"ABI38_0_0RCTAppState"; }

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
    // TODO: just make ABI38_0_0EXAppState a universal module implementing ABI38_0_0UMAppLifecycleService
    id<ABI38_0_0UMAppLifecycleService> lifeCycleManager = [[[self.bridge moduleForClass:[ABI38_0_0UMModuleRegistryHolderReactModule class]] moduleRegistry] getModuleImplementingProtocol:@protocol(ABI38_0_0UMAppLifecycleService)];
    if ([state isEqualToString:@"background"]) {
      [lifeCycleManager setAppStateToBackground];
    } else if ([state isEqualToString:@"active"]) {
      [lifeCycleManager setAppStateToForeground];
    }
  }
}

ABI38_0_0RCT_EXPORT_METHOD(getCurrentAppState:(ABI38_0_0RCTResponseSenderBlock)callback
                  error:(__unused ABI38_0_0RCTResponseSenderBlock)error)
{
  callback(@[@{@"app_state": _lastKnownState}]);
}

@end
