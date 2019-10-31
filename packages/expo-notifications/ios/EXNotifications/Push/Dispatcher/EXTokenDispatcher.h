// Copyright 2019-present 650 Industries. All rights reserved.

#ifndef EXTokenDispatcher_h
#define EXTokenDispatcher_h

#import <EXNotifications/EXOnTokenChangeListener.h>

@protocol EXTokenDispatcher <NSObject>

- (void)onNewToken:(NSData *)token;

- (void)registerForPushTokenWithAppId:(NSString*)appId onTokenChangeListener:(id<EXOnTokenChangeListener>)onTokenChangeListener;

- (void)unregisterWithAppId:(NSString*)appId;

@end

#endif /* EXTokenDispatcher_h */
