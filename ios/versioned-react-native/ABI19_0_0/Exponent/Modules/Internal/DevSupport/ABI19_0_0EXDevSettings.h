// Copyright 2015-present 650 Industries. All rights reserved.

#import <ReactABI19_0_0/ABI19_0_0RCTDevSettings.h>

@interface ABI19_0_0EXDevSettings : ABI19_0_0RCTDevSettings

- (instancetype)init NS_UNAVAILABLE;
- (instancetype)initWithExperienceId:(NSString *)experienceId
                       isDevelopment:(BOOL)isDevelopment NS_DESIGNATED_INITIALIZER;

@end
