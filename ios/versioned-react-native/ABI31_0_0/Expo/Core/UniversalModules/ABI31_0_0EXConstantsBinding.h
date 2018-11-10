// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI31_0_0EXConstants/ABI31_0_0EXConstantsService.h>
#import <ABI31_0_0EXConstantsInterface/ABI31_0_0EXConstantsInterface.h>

@interface ABI31_0_0EXConstantsBinding : ABI31_0_0EXConstantsService <ABI31_0_0EXInternalModule, ABI31_0_0EXConstantsInterface>

@property (nonatomic, readonly) NSString *appOwnership;

- (instancetype)initWithExperienceId:(NSString *)experienceId andParams:(NSDictionary *)params;

@end
