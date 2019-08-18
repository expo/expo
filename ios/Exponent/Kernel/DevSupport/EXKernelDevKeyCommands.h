// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

FOUNDATION_EXPORT NSNotificationName kEXKernelDidChangeMenuBehaviorNotification;

@interface EXKernelDevKeyCommands : NSObject

+ (instancetype)sharedInstance;

/**
 *  Whether to enable legacy gesture/button for the Expo menu.
 */
@property (nonatomic, assign) BOOL isLegacyMenuBehaviorEnabled;

/**
 *  Whether the legacy button is available.
 */
@property (nonatomic, readonly) BOOL isLegacyMenuButtonAvailable;

@end
