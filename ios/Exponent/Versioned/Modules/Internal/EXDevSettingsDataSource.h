// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <React/RCTBridge.h>

@interface EXDevSettingsDataSource : NSObject

- (instancetype)init NS_UNAVAILABLE;
- (instancetype)initWithDefaultValues:(NSDictionary *)defaultValues forBridge:(RCTBridge *)bridge NS_DESIGNATED_INITIALIZER;

@end
