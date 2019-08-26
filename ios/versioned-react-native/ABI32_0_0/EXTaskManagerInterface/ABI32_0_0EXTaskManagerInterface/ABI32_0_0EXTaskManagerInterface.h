// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI32_0_0EXTaskManagerInterface/ABI32_0_0EXTaskInterface.h>

// Interface for ABI32_0_0EXTaskManager module.

@protocol ABI32_0_0EXTaskManagerInterface

/**
 *  Returns boolean value whether task with given taskName has been registered by the app.
 */
- (BOOL)hasRegisteredTaskWithName:(nonnull NSString *)taskName;

/**
 *  Returns boolean value whether or not the task's consumer is a member of given class.
 */
- (BOOL)taskWithName:(nonnull NSString *)taskName hasConsumerOfClass:(Class)consumerClass;

/**
 *  Registers task with given name, task consumer class and options.
 *  Can throw an exception if task with given name is already registered
 *  or given consumer class doesn't conform to ABI32_0_0EXTaskConsumerInterface protocol.
 */
- (void)registerTaskWithName:(nonnull NSString *)taskName
                    consumer:(Class)consumerClass
                     options:(nonnull NSDictionary *)options;

/**
 *  Unregisters task with given name and consumer class.
 *  Can throw an exception if the consumer class mismatches.
 */
- (void)unregisterTaskWithName:(nonnull NSString *)taskName
                 consumerClass:(Class)consumerClass;

/**
 *  Returns boolean value whether the application contains
 *  given backgroundMode in UIBackgroundModes field in Info.plist file.
 */
- (BOOL)hasBackgroundModeEnabled:(nonnull NSString *)backgroundMode;

/**
 *  Called by task manager service to send an event with given body.
 */
- (void)executeWithBody:(nonnull NSDictionary *)body;

/**
 *  Whether or not the module was initialized for headless (background) JS app.
 */
- (BOOL)isRunningInHeadlessMode;

@end
