// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXAnalytics.h"
#import "EXBuildConstants.h"
#import "EXEnvironment.h"
#import "EXKernel.h"
#import "ExpoKit.h"

#import "Amplitude.h"

@import UIKit;

@interface EXAnalytics ()

@property (nonatomic, assign) EXKernelRoute visibleRoute;
@property (nonatomic, assign) BOOL isDisabled;

@end

@implementation EXAnalytics

+ (nonnull instancetype)sharedInstance
{
  static EXAnalytics *theAnalytics = nil;
  static dispatch_once_t once;
  dispatch_once(&once, ^{
    [self initAmplitude];
    if (!theAnalytics) {
      theAnalytics = [[EXAnalytics alloc] init];
    }
  });
  return theAnalytics;
}

+ (void)initAmplitude
{
  if ([self _isAnalyticsDisabled]) {
    return;
  }
  if ([EXBuildConstants sharedInstance].isDevKernel) {
    if ([ExpoKit sharedInstance].applicationKeys[@"AMPLITUDE_DEV_KEY"]) {
      [[Amplitude instance] initializeApiKey:[ExpoKit sharedInstance].applicationKeys[@"AMPLITUDE_DEV_KEY"]];
    }
  } else {
    if ([ExpoKit sharedInstance].applicationKeys[@"AMPLITUDE_KEY"]) {
      [[Amplitude instance] initializeApiKey:[ExpoKit sharedInstance].applicationKeys[@"AMPLITUDE_KEY"]];
    }
  }
}

+ (BOOL)_isAnalyticsDisabled
{
#ifdef EX_DETACHED
  return YES;
#else
  return NO;
#endif
}

- (instancetype)init
{
  if (self = [super init]) {
    _isDisabled = [[self class] _isAnalyticsDisabled];
    _visibleRoute = kEXKernelRouteUndefined;
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(_onApplicationEnterForeground) name:UIApplicationWillEnterForegroundNotification object:nil];
  }
  return self;
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void)setUserProperties: (nonnull NSDictionary *)props
{
  if (_isDisabled) {
    return;
  }
  [[Amplitude instance] setUserProperties:props];
}

- (void)logEvent:(NSString *)eventIdentifier manifestUrl:(nonnull NSURL *)url eventProperties:(nullable NSDictionary *)properties
{
  if (_isDisabled) {
    return;
  }
  NSMutableDictionary *mutableProps = (properties) ? [properties mutableCopy] : [NSMutableDictionary dictionary];
  [mutableProps setObject:url.absoluteString forKey:@"MANIFEST_URL"];
  [self _logEvent:eventIdentifier withEventProperties:mutableProps];
}

- (void)logErrorVisibleEvent
{
  if (_isDisabled) {
    return;
  }
  NSString *eventIdentifier = @"ERROR_APPEARED";
  NSDictionary *eventProperties = @{ @"SOURCE": @"SYSTEM" };
  [self _logEvent:eventIdentifier withEventProperties:eventProperties];
}

- (void)logAppVisibleEvent
{
  if (_isDisabled) {
    return;
  }
  EXKernelAppRecord *visibleApp = [EXKernel sharedInstance].visibleApp;
  NSString *eventIdentifier = (visibleApp == [EXKernel sharedInstance].appRegistry.homeAppRecord)
    ? @"HOME_APPEARED"
    : @"EXPERIENCE_APPEARED";
  NSDictionary *eventProperties = @{ @"SOURCE": @"SYSTEM" };
  [self _logEvent:eventIdentifier withEventProperties:eventProperties];
}

#pragma mark - Internal

- (void)_logEvent:(NSString *)eventId withEventProperties:(NSDictionary *)props
{
  // hack owls
  // 🦉🦉🦉
  //             🦉
  if (![EXEnvironment sharedEnvironment].isDetached && ![eventId isEqualToString:@"LOAD_EXPERIENCE"]) {
    // if not detached, and some other event besides LOAD_EXPERIENCE, omit
    return;
  }
  [[Amplitude instance] logEvent:eventId withEventProperties:props];
}

- (void)setVisibleRoute:(EXKernelRoute)route
{
  _visibleRoute = (route < kEXKernelRouteUndefined) ? route : kEXKernelRouteUndefined;
}

- (void)_onApplicationEnterForeground
{
  [self logAppVisibleEvent];
}

@end
