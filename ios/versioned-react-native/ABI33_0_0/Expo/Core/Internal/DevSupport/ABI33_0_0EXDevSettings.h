// Copyright 2015-present 650 Industries. All rights reserved.

#import <ReactABI33_0_0/ABI33_0_0RCTDevSettings.h>

@interface ABI33_0_0EXDevSettings : ABI33_0_0RCTDevSettings

- (instancetype)init NS_UNAVAILABLE;
- (instancetype)initWithExperienceId:(NSString *)experienceId
                       isDevelopment:(BOOL)isDevelopment NS_DESIGNATED_INITIALIZER;

@end
