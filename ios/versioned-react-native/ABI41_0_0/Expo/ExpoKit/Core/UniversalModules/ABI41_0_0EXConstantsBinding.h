// Copyright 2015-present 650 Industries. All rights reserved.
#import <Foundation/Foundation.h>

#if __has_include(<ABI41_0_0EXConstants/ABI41_0_0EXConstantsService.h>)
#import <ABI41_0_0EXConstants/ABI41_0_0EXConstantsService.h>
#import <ABI41_0_0UMConstantsInterface/ABI41_0_0UMConstantsInterface.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI41_0_0EXConstantsBinding : ABI41_0_0EXConstantsService <ABI41_0_0UMInternalModule, ABI41_0_0UMConstantsInterface>

@property (nonatomic, readonly) NSString *appOwnership;

- (instancetype)initWithExperienceId:(NSString *)experienceId andParams:(NSDictionary *)params;

@end

NS_ASSUME_NONNULL_END

#endif
