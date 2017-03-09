// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ReactABI15_0_0/ABI15_0_0RCTDevSettings.h>

@interface ABI15_0_0EXDevSettingsDataSource : NSObject <ABI15_0_0RCTDevSettingsDataSource>

- (instancetype)init NS_UNAVAILABLE;
- (instancetype)initWithDefaultValues:(NSDictionary *)defaultValues forExperienceId:(NSString *)experienceId NS_DESIGNATED_INITIALIZER;

@end
