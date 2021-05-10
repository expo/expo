// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI39_0_0React/ABI39_0_0RCTDevSettings.h>

@interface ABI39_0_0EXDevSettings : ABI39_0_0RCTDevSettings

- (instancetype)init NS_UNAVAILABLE;
- (instancetype)initWithExperienceId:(NSString *)experienceId
                       isDevelopment:(BOOL)isDevelopment NS_DESIGNATED_INITIALIZER;

@end
