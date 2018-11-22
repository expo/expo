// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <Firebase.h>
#import <EXCore/EXEventEmitterService.h>

static NSString *const DEFAULT_APP_DISPLAY_NAME = @"[DEFAULT]";
static NSString *const DEFAULT_APP_NAME = @"__FIRAPP_DEFAULT";

@interface EXFirebaseAppUtil : NSObject

+ (NSString *)getISO8601String:(NSDate *)date;
+ (FIRApp *)getApp:(NSString *)appDisplayName;
+ (NSString *)getAppName:(NSString *)appDisplayName;
+ (NSString *)getAppDisplayName:(NSString *)appName;
+ (void)sendJSEvent:(id<EXEventEmitterService>)emitter name:(NSString *)name body:(id)body;
+ (void)sendJSEventWithAppName:(id<EXEventEmitterService>)emitter app:(FIRApp *)app name:(NSString *)name body:(id)body;

@end
