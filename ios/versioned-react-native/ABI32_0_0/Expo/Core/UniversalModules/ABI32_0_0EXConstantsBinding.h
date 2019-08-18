// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI32_0_0EXConstants/ABI32_0_0EXConstantsService.h>
#import <ABI32_0_0EXConstantsInterface/ABI32_0_0EXConstantsInterface.h>

@interface ABI32_0_0EXConstantsBinding : ABI32_0_0EXConstantsService <ABI32_0_0EXInternalModule, ABI32_0_0EXConstantsInterface>

@property (nonatomic, readonly) NSString *appOwnership;

- (instancetype)initWithExperienceId:(NSString *)experienceId andParams:(NSDictionary *)params;

@end
