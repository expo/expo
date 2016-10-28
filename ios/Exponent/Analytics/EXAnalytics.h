// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

typedef enum EXKernelRoute : NSUInteger {
  kEXKernelRouteHome,
  kEXKernelRouteBrowser,
  kEXKernelRouteError,
  kEXKernelRouteUndefined,
} EXKernelRoute;

@interface EXAnalytics : NSObject

+ (nonnull instancetype)sharedInstance;

- (void)logEvent: (nonnull NSString *)eventIdentifier
     manifestUrl: (nonnull NSURL *)url
 eventProperties: (nullable NSDictionary *)properties;

- (void)setUserProperties: (nonnull NSDictionary *)props;

/**
 *  @param isFromJS true if the event came from an action taken in JS.
 *         false if the event came from iOS.
 */
- (void)logForegroundEventForRoute:(EXKernelRoute)route fromJS:(BOOL)isFromJS;

@end
