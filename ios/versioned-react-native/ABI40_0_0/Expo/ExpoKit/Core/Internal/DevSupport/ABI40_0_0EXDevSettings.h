// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI40_0_0React/ABI40_0_0RCTDevSettings.h>

@interface ABI40_0_0EXDevSettings : ABI40_0_0RCTDevSettings

- (instancetype)init NS_UNAVAILABLE;
- (instancetype)initWithExperienceId:(NSString *)experienceId
                       isDevelopment:(BOOL)isDevelopment NS_DESIGNATED_INITIALIZER;

@end
