// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <EXConstants/EXConstantsService.h>
#import <UMConstantsInterface/UMConstantsInterface.h>

@interface EXConstantsBinding : EXConstantsService <UMInternalModule, UMConstantsInterface>

@property (nonatomic, readonly) NSString *appOwnership;

- (instancetype)initWithExperienceId:(NSString *)experienceId andParams:(NSDictionary *)params;

@end
