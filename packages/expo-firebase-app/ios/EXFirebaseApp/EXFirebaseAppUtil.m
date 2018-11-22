// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXFirebaseApp/EXFirebaseAppUtil.h>

@implementation EXFirebaseAppUtil

+ (NSString *)getISO8601String:(NSDate *)date {
  static NSDateFormatter *formatter = nil;
  
  if (!formatter) {
    formatter = [[NSDateFormatter alloc] init];
    [formatter setLocale:[NSLocale localeWithLocaleIdentifier:@"en_US_POSIX"]];
    formatter.timeZone = [NSTimeZone timeZoneWithAbbreviation:@"UTC"];
    [formatter setDateFormat:@"yyyy-MM-dd'T'HH:mm:ss"];
  }
  
  NSString *iso8601String = [formatter stringFromDate:date];
  
  return [iso8601String stringByAppendingString:@"Z"];
}

+ (FIRApp *)getApp:(NSString *)appDisplayName {
  NSString *appName = [EXFirebaseAppUtil getAppName:appDisplayName];
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
