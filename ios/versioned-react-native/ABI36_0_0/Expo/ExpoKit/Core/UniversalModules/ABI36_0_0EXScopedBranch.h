// Copyright 2019-present 650 Industries. All rights reserved.

#if __has_include(<ABI36_0_0EXBranch/ABI36_0_0RNBranch.h>)
#import <ABI36_0_0EXBranch/ABI36_0_0RNBranch.h>
#import <ABI36_0_0UMCore/ABI36_0_0UMInternalModule.h>
#import <ABI36_0_0UMCore/ABI36_0_0UMModuleRegistryConsumer.h>

NS_ASSUME_NONNULL_BEGIN

@protocol ABI36_0_0EXBranchScopedModuleDelegate

- (void)branchModuleDidInit:(id _Nonnull)branchModule;

@end

@interface ABI36_0_0EXScopedBranch : ABI36_0_0RNBranch <ABI36_0_0UMModuleRegistryConsumer, ABI36_0_0UMInternalModule>

@property (nonatomic, strong) NSString *experienceId;

- (instancetype)initWithExperienceId:(NSString *)experienceId;

@end

NS_ASSUME_NONNULL_END
#endif
