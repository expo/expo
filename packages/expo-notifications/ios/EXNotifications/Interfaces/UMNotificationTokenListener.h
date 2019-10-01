// Copyright 2018-present 650 Industries. All rights reserved.

@protocol UMNotificationTokenListener

- (void)onNewToken:(NSData *)newToken;
- (void)onFailedToRegisterWithError:(NSError *)error;

@end
