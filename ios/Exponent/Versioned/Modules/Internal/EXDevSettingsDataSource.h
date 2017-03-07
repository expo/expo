// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <React/RCTDevSettings.h>

@interface EXDevSettingsDataSource : NSObject <RCTDevSettingsDataSource>

- (instancetype)init NS_UNAVAILABLE;
- (instancetype)initWithDefaultValues:(NSDictionary *)defaultValues forExperienceId:(NSString *)experienceId NS_DESIGNATED_INITIALIZER;

@end
