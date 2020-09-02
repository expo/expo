// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI39_0_0UMCore/ABI39_0_0UMEventEmitterService.h>
#import <UserNotifications/UserNotifications.h>

NS_ASSUME_NONNULL_BEGIN

@class ABI39_0_0EXSingleNotificationHandlerTask;

@protocol ABI39_0_0EXSingleNotificationHandlerTaskDelegate

- (void)taskDidFinish:(ABI39_0_0EXSingleNotificationHandlerTask *)task;

@end

@interface ABI39_0_0EXSingleNotificationHandlerTask : NSObject

+ (NSArray<NSString *> *)eventNames;

- (instancetype)initWithEventEmitter:(id<ABI39_0_0UMEventEmitterService>)eventEmitter
                        notification:(UNNotification *)notification
                   completionHandler:(void (^)(UNNotificationPresentationOptions))completionHandler
                            delegate:(id<ABI39_0_0EXSingleNotificationHandlerTaskDelegate>)delegate;

- (NSString *)identifier;

- (void)start;
- (nullable NSError *)handleResponse:(NSDictionary *)response;

@end

NS_ASSUME_NONNULL_END
