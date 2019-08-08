// Copyright 2019-present 650 Industries. All rights reserved.

#if __has_include(<EXBranch/RNBranch.h>)
#import <EXBranch/RNBranch.h>
#import <UMCore/UMInternalModule.h>
#import <UMCore/UMModuleRegistryConsumer.h>

NS_ASSUME_NONNULL_BEGIN

@protocol EXBranchScopedModuleDelegate

- (void)branchModuleDidInit:(id _Nonnull)branchModule;

@end

@interface EXScopedBranch : RNBranch <UMModuleRegistryConsumer, UMInternalModule>

@property (nonatomic, strong) NSString *experienceId;

- (instancetype)initWithExperienceId:(NSString *)experienceId;

@end

NS_ASSUME_NONNULL_END
#endif
