// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXEventEmitterService.h>
#import <UserNotifications/UserNotifications.h>

NS_ASSUME_NONNULL_BEGIN

@class ABI45_0_0EXSingleNotificationHandlerTask;

@protocol ABI45_0_0EXSingleNotificationHandlerTaskDelegate

- (void)taskDidFinish:(ABI45_0_0EXSingleNotificationHandlerTask *)task;

@end

@interface ABI45_0_0EXSingleNotificationHandlerTask : NSObject

+ (NSArray<NSString *> *)eventNames;

- (instancetype)initWithEventEmitter:(id<ABI45_0_0EXEventEmitterService>)eventEmitter
                        notification:(UNNotification *)notification
                   completionHandler:(void (^)(UNNotificationPresentationOptions))completionHandler
                            delegate:(id<ABI45_0_0EXSingleNotificationHandlerTaskDelegate>)delegate;

- (NSString *)identifier;

- (void)start;
- (nullable NSError *)handleResponse:(NSDictionary *)response;

@end

NS_ASSUME_NONNULL_END
