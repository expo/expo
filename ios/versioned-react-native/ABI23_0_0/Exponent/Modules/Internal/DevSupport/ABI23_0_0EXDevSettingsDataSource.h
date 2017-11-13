// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ReactABI23_0_0/ABI23_0_0RCTDevSettings.h>

@interface ABI23_0_0EXDevSettingsDataSource : NSObject <ABI23_0_0RCTDevSettingsDataSource>

- (instancetype)init NS_UNAVAILABLE;
- (instancetype)initWithDefaultValues:(NSDictionary *)defaultValues
                      forExperienceId:(NSString *)experienceId
                        isDevelopment:(BOOL)isDevelopment NS_DESIGNATED_INITIALIZER;

@end
