// Copyright 2015-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXTaskInterface.h>

@protocol EXTaskServiceInterface

/**
 *  Returns boolean value whether the task with given name is already registered for given appId.
 */
- (BOOL)hasRegisteredTaskWithName:(nonnull NSString *)taskName
                         forAppId:(nonnull NSString *)appId;

/**
 *  Registers task in any kind of persistent storage, so it could be restored in future sessions.
 */
- (void)registerTaskWithName:(nonnull NSString *)taskName
                       appId:(nonnull NSString *)appId
                      appUrl:(nonnull NSString *)appUrl
               consumerClass:(nonnull Class)consumerClass
                     options:(nullable NSDictionary *)options;

/**
 *  Unregisters task with given name and for given appId. If consumer class is provided,
 *  it can throw an exception if task's consumer is not a member of that class.
 */
- (void)unregisterTaskWithName:(nonnull NSString *)taskName
                      forAppId:(nonnull NSString *)appId
                 consumerClass:(nullable Class)consumerClass;

/**
 *  Unregisters all tasks registered for the app with given appId.
 */
- (void)unregisterAllTasksForAppId:(nonnull NSString *)appId;

/**
 *  Returns boolean value whether or not the task's consumer is a member of given class.
 */
- (BOOL)taskWithName:(nonnull NSString *)taskName
            forAppId:(nonnull NSString *)appId
  hasConsumerOfClass:(nonnull Class)consumerClass;

/**
 *  Returns options associated with the task with given name and appId or nil if task not found.
 */
- (nullable NSDictionary *)getOptionsForTaskName:(nonnull NSString *)taskName
                                        forAppId:(nonnull NSString *)appId;

/**
 *  Returns an array of registered tasks for given appId.
 */
- (nonnull NSArray *)getRegisteredTasksForAppId:(nullable NSString *)appId;

/**
 *  Notifies the service that a task has just finished.
 */
- (void)notifyTaskWithName:(nonnull NSString *)taskName
                  forAppId:(nonnull NSString *)appId
     didFinishWithResponse:(nonnull NSDictionary *)response;

/**
 *  Passes a reference of task manager for given appId to the service.
 */
- (void)setTaskManager:(nonnull id<EXTaskManagerInterface>)taskManager
              forAppId:(nonnull NSString *)appId
               withUrl:(nonnull NSString *)appUrl;

@end
