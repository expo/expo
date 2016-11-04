// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@class EXViewController;

@interface ExponentViewManager : NSObject

+ (instancetype)sharedInstance;

/**
 *  The root Exponent view controller hosting a detached Exponent app.
 */
- (EXViewController *)rootViewController;

- (void)setLaunchOptions:(NSDictionary * _Nullable)launchOptions;

@end

NS_ASSUME_NONNULL_END
