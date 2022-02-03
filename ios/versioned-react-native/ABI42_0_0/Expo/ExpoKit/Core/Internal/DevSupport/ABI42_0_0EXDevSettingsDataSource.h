// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI42_0_0React/ABI42_0_0RCTDevSettings.h>

@interface ABI42_0_0EXDevSettingsDataSource : NSObject <ABI42_0_0RCTDevSettingsDataSource>

- (instancetype)init NS_UNAVAILABLE;
- (instancetype)initWithDefaultValues:(NSDictionary *)defaultValues
                          forScopeKey:(NSString *)scopeKey
                        isDevelopment:(BOOL)isDevelopment NS_DESIGNATED_INITIALIZER;

@end
