// Copyright 2016-present 650 Industries. All rights reserved.

#import <React/RCTBridgeModule.h>

@interface EXNotifications : NSObject <RCTBridgeModule>

- (instancetype)initWithExperienceId: (NSString *)experienceId;

@end
