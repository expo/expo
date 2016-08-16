// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXAnalytics.h"

#import "Amplitude.h"

@import UIKit;

@interface EXAnalytics ()

@property (nonatomic, assign) EXKernelRoute visibleRoute;

@end

@implementation EXAnalytics

+ (nonnull instancetype)sharedInstance
{
  static EXAnalytics *theAnalytics = nil;
  static dispatch_once_t once;
  dispatch_once(&once, ^{
    if (!theAnalytics) {
      theAnalytics = [[EXAnalytics alloc] init];
    }
  });
  return theAnalytics;
}

- (instancetype)init
{
  if (self = [super init]) {
    _visibleRoute = kEXKernelRouteUndefined;
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(_onApplicationEnterForeground) name:UIApplicationWillEnterForegroundNotification object:nil];
  }
  return self;
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void)logEvent:(NSString *)eventIdentifier manifestUrl:(nonnull NSURL *)url eventProperties:(nullable NSDictionary *)properties
{
  NSMutableDictionary *mutableProps = (properties) ? [properties mutableCopy] : [NSMutableDictionary dictionary];
  [mutableProps setObject:url.absoluteString forKey:@"MANIFEST_URL"];
  [[Amplitude instance] logEvent:eventIdentifier withEventProperties:mutableProps];
}

- (void)logForegroundEventForRoute:(EXKernelRoute)route fromJS:(BOOL)isFromJS
{
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
