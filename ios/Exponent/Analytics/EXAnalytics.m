// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXAnalytics.h"
#import "EXKernel.h"
#import "EXKeys.h"

#import "Amplitude.h"

NSString * const kEXAnalyticsDisabledConfigKey = @"EXAnalyticsDisabled";

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
  if ([EXKernel isDevKernel]) {
#ifdef AMPLITUDE_DEV_KEY
    [[Amplitude instance] initializeApiKey:AMPLITUDE_DEV_KEY];
#endif
  } else {
#ifdef AMPLITUDE_KEY
    [[Amplitude instance] initializeApiKey:AMPLITUDE_KEY];
#endif
  }
}

+ (BOOL)_isAnalyticsDisabled
{
  return [[[NSBundle mainBundle].infoDictionary objectForKey:kEXAnalyticsDisabledConfigKey] boolValue];
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
  [[Amplitude instance] logEvent:eventIdentifier withEventProperties:mutableProps];
}

- (void)logForegroundEventForRoute:(EXKernelRoute)route fromJS:(BOOL)isFromJS
{
  if (_isDisabled) {
    return;
  }
  self.visibleRoute = route;
  if (route < kEXKernelRouteUndefined) {
    NSArray *eventIdentifiers = @[ @"HOME_APPEARED", @"EXPERIENCE_APPEARED", @"ERROR_APPEARED" ];
    NSDictionary *eventProperties = @{ @"SOURCE": (isFromJS) ? @"JS" : @"SYSTEM" };
    [[Amplitude instance] logEvent:eventIdentifiers[route] withEventProperties:eventProperties];
  }
}

#pragma mark - Internal

- (void)setVisibleRoute:(EXKernelRoute)route
{
  _visibleRoute = (route < kEXKernelRouteUndefined) ? route : kEXKernelRouteUndefined;
}

- (void)_onApplicationEnterForeground
{
  [self logForegroundEventForRoute:_visibleRoute fromJS:NO];
}

@end
