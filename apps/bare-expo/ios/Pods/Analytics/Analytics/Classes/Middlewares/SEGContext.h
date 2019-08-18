//
//  SEGContext.h
//  Analytics
//
//  Created by Tony Xiao on 9/19/16.
//  Copyright © 2016 Segment. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "SEGIntegration.h"

typedef NS_ENUM(NSInteger, SEGEventType) {
    // Should not happen, but default state
    SEGEventTypeUndefined,
    // Core Tracking Methods
    SEGEventTypeIdentify,
    SEGEventTypeTrack,
    SEGEventTypeScreen,
    SEGEventTypeGroup,
    SEGEventTypeAlias,

    // General utility
    SEGEventTypeReset,
    SEGEventTypeFlush,

    // Remote Notification
    SEGEventTypeReceivedRemoteNotification,
    SEGEventTypeFailedToRegisterForRemoteNotifications,
    SEGEventTypeRegisteredForRemoteNotifications,
    SEGEventTypeHandleActionWithForRemoteNotification,

    // Application Lifecycle
    SEGEventTypeApplicationLifecycle,
    //    DidFinishLaunching,
    //    SEGEventTypeApplicationDidEnterBackground,
    //    SEGEventTypeApplicationWillEnterForeground,
    //    SEGEventTypeApplicationWillTerminate,
    //    SEGEventTypeApplicationWillResignActive,
    //    SEGEventTypeApplicationDidBecomeActive,

    // Misc.
    SEGEventTypeContinueUserActivity,
    SEGEventTypeOpenURL,

};

@class SEGAnalytics;
@protocol SEGMutableContext;


@interface SEGContext : NSObject <NSCopying>

// Loopback reference to the top level SEGAnalytics object.
// Not sure if it's a good idea to keep this around in the context.
// since we don't really want people to use it due to the circular
// reference and logic (Thus prefixing with underscore). But
// Right now it is required for integrations to work so I guess we'll leave it in.
@property (nonatomic, readonly, nonnull) SEGAnalytics *_analytics;
@property (nonatomic, readonly) SEGEventType eventType;

@property (nonatomic, readonly, nullable) NSString *userId;
@property (nonatomic, readonly, nullable) NSString *anonymousId;
@property (nonatomic, readonly, nullable) NSError *error;
@property (nonatomic, readonly, nullable) SEGPayload *payload;
@property (nonatomic, readonly) BOOL debug;

- (instancetype _Nonnull)initWithAnalytics:(SEGAnalytics *_Nonnull)analytics;

- (SEGContext *_Nonnull)modify:(void (^_Nonnull)(id<SEGMutableContext> _Nonnull ctx))modify;

@end

@protocol SEGMutableContext <NSObject>

@property (nonatomic) SEGEventType eventType;
@property (nonatomic, nullable) NSString *userId;
@property (nonatomic, nullable) NSString *anonymousId;
@property (nonatomic, nullable) SEGPayload *payload;
@property (nonatomic, nullable) NSError *error;
@property (nonatomic) BOOL debug;

@end
