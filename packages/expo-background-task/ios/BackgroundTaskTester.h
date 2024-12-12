// Copyright 2024-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * This interface/implementation in Objective-C ensures that the triggerBackgroundTaskTest is
 * only compiled in debug mode. There is some uncertainty about whether Swift's #if
 * conditionals work the same way as in Objective-C.
 */
@interface BackgroundTaskTester: NSObject

- (void) triggerBackgroundTaskTest;

@end

NS_ASSUME_NONNULL_END
