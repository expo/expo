// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@protocol ABI42_0_0EXPushTokenListener

- (void)onDidRegisterWithDeviceToken:(NSData *)token;
- (void)onDidFailToRegisterWithError:(NSError *)error;

@end

NS_ASSUME_NONNULL_END
