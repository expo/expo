//
//  EXFirebaseAppUtil.m
//  EXFirebaseApp
//
//  Created by Evan Bacon on 8/6/18.
//  Copyright © 2018 650 Industries. All rights reserved.
//

#import <EXFirebaseApp/EXFirebaseAppUtil.h>

@implementation EXFirebaseAppUtil

+ (FIRApp *)getApp:(NSString *)appDisplayName {
    NSString *appName = [EXFirebaseAppUtil getAppName:appDisplayName];
    if (appDisplayName == nil) {
      return [FIRApp defaultApp];
    }
    return [FIRApp appNamed:appName];
}

+ (NSString *)getAppName:(NSString *)appDisplayName {
    if ([appDisplayName isEqualToString:DEFAULT_APP_DISPLAY_NAME]) {
        return DEFAULT_APP_NAME;
    }
    return appDisplayName;
}

+ (NSString *)getAppDisplayName:(NSString *)appName {
    if ([appName isEqualToString:DEFAULT_APP_NAME]) {
        return DEFAULT_APP_DISPLAY_NAME;
    }
    return appName;
}

+ (void)sendJSEvent:(id<EXEventEmitterService>)emitter name:(NSString *)name body:(id)body {
    if (emitter != nil) {
      @try {
          [emitter sendEventWithName:name body:body];
      } @catch (NSException *error) {
          NSLog(@"An error occurred in sendJSEvent: %@", [error debugDescription]);
      }
    }
}

+ (void)sendJSEventWithAppName:(id<EXEventEmitterService>)emitter app:(FIRApp *)app name:(NSString *)name body:(id)body {
    // Add the appName to the body
    NSMutableDictionary *newBody = [body mutableCopy];
    newBody[@"appName"] = [EXFirebaseAppUtil getAppDisplayName:app.name];
    
    [EXFirebaseAppUtil sendJSEvent:emitter name:name body:newBody];
}

@end
