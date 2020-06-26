// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

@interface EXDevMenuGestureInterceptor : NSObject

/**
 * Installs gesture interceptor. Overrides the default implementation of `gestureRecognizers` in `UIWindow`.
 */
+ (void)install;

/**
 * Uninstalls gesture interceptor. Brings back the default implementation of `gestureRecognizers` in `UIWindow`.
 */
+ (void)uninstall;

/**
 * Returns `YES` if gesture interceptor is currently installed, `NO` otherwise.
 */
+ (BOOL)isInstalled;

@end
