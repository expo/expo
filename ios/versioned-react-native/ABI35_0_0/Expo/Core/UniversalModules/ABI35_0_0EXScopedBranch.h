// Copyright 2019-present 650 Industries. All rights reserved.

#if __has_include(<ABI35_0_0EXBranch/RNBranch.h>)
#import <ABI35_0_0EXBranch/RNBranch.h>
#import <ABI35_0_0UMCore/ABI35_0_0UMInternalModule.h>
#import <ABI35_0_0UMCore/ABI35_0_0UMModuleRegistryConsumer.h>

NS_ASSUME_NONNULL_BEGIN

@protocol ABI35_0_0EXBranchScopedModuleDelegate

- (void)branchModuleDidInit:(id _Nonnull)branchModule;

@end

@interface ABI35_0_0EXScopedBranch : RNBranch <ABI35_0_0UMModuleRegistryConsumer, ABI35_0_0UMInternalModule>

@property (nonatomic, strong) NSString *experienceId;

- (instancetype)initWithExperienceId:(NSString *)experienceId;

@end

NS_ASSUME_NONNULL_END
#endif
