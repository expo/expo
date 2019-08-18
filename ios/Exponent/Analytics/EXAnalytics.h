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

- (void)logAppVisibleEvent;
- (void)logErrorVisibleEvent;

@end
