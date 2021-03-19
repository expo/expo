// Copyright 2019-present 650 Industries. All rights reserved.
#if __has_include(<ABI41_0_0EXBranch/ABI41_0_0RNBranch.h>)
#import "ABI41_0_0EXScopedBranch.h"

@interface ABI41_0_0EXScopedBranch ()

@property (nonatomic, weak) ABI41_0_0UMModuleRegistry *moduleRegistry;

@end

@protocol ABI41_0_0EXDummyBranchProtocol
@end

@implementation ABI41_0_0EXScopedBranch

@synthesize bridge = _bridge;

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(ABI41_0_0EXDummyBranchProtocol)];
}

- (instancetype)initWithExperienceId:(NSString *)experienceId
{
  if (self = [super init]) {
    [[NSNotificationCenter defaultCenter] removeObserver:self name:ABI41_0_0RNBranchLinkOpenedNotification object:nil];
    _experienceId = experienceId;
  }
  return self;
}

- (void)setModuleRegistry:(ABI41_0_0UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
  [(id<ABI41_0_0EXBranchScopedModuleDelegate>)[_moduleRegistry getSingletonModuleForName:@"BranchManager"] branchModuleDidInit:self];
}

- (void)setBridge:(ABI41_0_0RCTBridge *)bridge
{
  _bridge = bridge;
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wundeclared-selector"
  [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(onInitSessionFinished:) name:ABI41_0_0RNBranchLinkOpenedNotification object:nil];
#pragma clang diagnostic pop
}

@end
#endif
