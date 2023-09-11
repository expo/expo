// Copyright 2019-present 650 Industries. All rights reserved.
#if __has_include(<ABI47_0_0EXBranch/ABI47_0_0RNBranch.h>)
#import "ABI47_0_0EXScopedBranch.h"

@interface ABI47_0_0EXScopedBranch ()

@property (nonatomic, weak) ABI47_0_0EXModuleRegistry *exModuleRegistry;

@end

@protocol ABI47_0_0EXDummyBranchProtocol
@end

@implementation ABI47_0_0EXScopedBranch

@synthesize bridge = _bridge;

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(ABI47_0_0EXDummyBranchProtocol)];
}

- (instancetype)initWithScopeKey:(NSString *)scopeKey
{
  if (self = [super init]) {
    [[NSNotificationCenter defaultCenter] removeObserver:self name:ABI47_0_0RNBranchLinkOpenedNotification object:nil];
    _scopeKey = scopeKey;
  }
  return self;
}

- (void)setModuleRegistry:(ABI47_0_0EXModuleRegistry *)exModuleRegistry
{
  _exModuleRegistry = exModuleRegistry;
  [(id<ABI47_0_0EXBranchScopedModuleDelegate>)[_exModuleRegistry getSingletonModuleForName:@"BranchManager"] branchModuleDidInit:self];
}

- (void)setBridge:(ABI47_0_0RCTBridge *)bridge
{
  _bridge = bridge;
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wundeclared-selector"
  [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(onInitSessionFinished:) name:ABI47_0_0RNBranchLinkOpenedNotification object:nil];
#pragma clang diagnostic pop
}

@end
#endif
