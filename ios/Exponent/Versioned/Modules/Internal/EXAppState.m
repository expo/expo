// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXAppState.h"

#import "RCTAssert.h"
#import "RCTBridge.h"
#import "RCTEventDispatcher.h"
#import "RCTUtils.h"

@interface EXAppState ()

@property (nonatomic, assign) BOOL isObserving;

@end

@implementation EXAppState

+ (NSString *)moduleName { return @"RCTAppState"; }

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
  }
}

RCT_EXPORT_METHOD(getCurrentAppState:(RCTResponseSenderBlock)callback
                  error:(__unused RCTResponseSenderBlock)error)
{
  callback(@[@{@"app_state": _lastKnownState}]);
}

@end
