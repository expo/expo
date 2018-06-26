// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <EXConstants/EXConstantsService.h>
#import <EXConstantsInterface/EXConstantsInterface.h>

@interface EXConstantsBinding : EXConstantsService <EXInternalModule, EXConstantsInterface>

@property (nonatomic, readonly) NSString *appOwnership;

- (instancetype)initWithExperienceId:(NSString *)experienceId andParams:(NSDictionary *)params;

@end
