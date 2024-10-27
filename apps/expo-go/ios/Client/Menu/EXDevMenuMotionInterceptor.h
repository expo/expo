// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

@interface EXDevMenuMotionInterceptor : NSObject

/**
 * Installs motion interceptor. Overrides the default implementation of `motionEnded:withEvent:` in `UIWindow`.
 */
+ (void)install;

/**
 * Uninstalls motion interceptor. Brings back the default implementation of `motionEnded:withEvent:` in `UIWindow`.
 */
+ (void)uninstall;

/**
 * Returns `YES` if motion interceptor is currently installed, `NO` otherwise.
 */
+ (BOOL)isInstalled;

@end
