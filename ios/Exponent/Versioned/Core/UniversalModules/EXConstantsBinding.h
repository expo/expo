// Copyright 2015-present 650 Industries. All rights reserved.
#import <Foundation/Foundation.h>

#if __has_include(<EXConstants/EXConstantsService.h>)
#import <EXConstants/EXConstantsService.h>
#import <UMConstantsInterface/UMConstantsInterface.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXConstantsBinding : EXConstantsService <UMInternalModule, UMConstantsInterface>

@property (nonatomic, readonly) NSString *appOwnership;

- (instancetype)initWithExperienceId:(NSString *)experienceId andParams:(NSDictionary *)params;

@end

NS_ASSUME_NONNULL_END

#endif
