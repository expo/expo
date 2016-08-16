// Copyright 2016-present 650 Industries. All rights reserved.

#import "RCTBridgeModule.h"

@interface EXFileSystem : NSObject <RCTBridgeModule>

- (instancetype)initWithExperienceId:(NSString *)experienceId;

@end