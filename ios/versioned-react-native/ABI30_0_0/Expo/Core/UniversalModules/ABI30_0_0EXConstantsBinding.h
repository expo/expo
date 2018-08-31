// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI30_0_0EXConstants/ABI30_0_0EXConstantsService.h>
#import <ABI30_0_0EXConstantsInterface/ABI30_0_0EXConstantsInterface.h>

@interface ABI30_0_0EXConstantsBinding : ABI30_0_0EXConstantsService <ABI30_0_0EXInternalModule, ABI30_0_0EXConstantsInterface>

@property (nonatomic, readonly) NSString *appOwnership;

- (instancetype)initWithExperienceId:(NSString *)experienceId andParams:(NSDictionary *)params;

@end
