// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI29_0_0EXConstants/ABI29_0_0EXConstantsService.h>
#import <ABI29_0_0EXConstantsInterface/ABI29_0_0EXConstantsInterface.h>

@interface ABI29_0_0EXConstantsBinding : ABI29_0_0EXConstantsService <ABI29_0_0EXInternalModule, ABI29_0_0EXConstantsInterface>

@property (nonatomic, readonly) NSString *appOwnership;

- (instancetype)initWithExperienceId:(NSString *)experienceId andParams:(NSDictionary *)params;

@end
