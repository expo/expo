// Copyright 2019-present 650 Industries. All rights reserved.

#if __has_include(<EXBranch/RNBranch.h>)
#import <EXBranch/RNBranch.h>
#import <ExpoModulesCore/EXInternalModule.h>
#import <ExpoModulesCore/EXModuleRegistryConsumer.h>

NS_ASSUME_NONNULL_BEGIN

@protocol EXBranchScopedModuleDelegate

- (void)branchModuleDidInit:(id _Nonnull)branchModule;

@end

@interface EXScopedBranch : RNBranch <EXModuleRegistryConsumer, EXInternalModule>

@property (nonatomic, strong) NSString *scopeKey;

- (instancetype)initWithScopeKey:(NSString *)scopeKey;

@end

NS_ASSUME_NONNULL_END
#endif
