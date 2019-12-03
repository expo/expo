// Copyright 2019-present 650 Industries. All rights reserved.
#if __has_include(<EXBranch/RNBranch.h>)
#import "EXScopedBranch.h"

@interface EXScopedBranch ()

@property (nonatomic, weak) UMModuleRegistry *moduleRegistry;

@end

@protocol EXDummyBranchProtocol
@end

@implementation EXScopedBranch

@synthesize bridge = _bridge;

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(EXDummyBranchProtocol)];
}

- (instancetype)initWithExperienceId:(NSString *)experienceId
{
  if (self = [super init]) {
    [[NSNotificationCenter defaultCenter] removeObserver:self name:RNBranchLinkOpenedNotification object:nil];
    _experienceId = experienceId;
  }
  return self;
}

- (void)setModuleRegistry:(UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
  [(id<EXBranchScopedModuleDelegate>)[_moduleRegistry getSingletonModuleForName:@"BranchManager"] branchModuleDidInit:self];
}

- (void)setBridge:(RCTBridge *)bridge
{
  _bridge = bridge;
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wundeclared-selector"
  [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(onInitSessionFinished:) name:RNBranchLinkOpenedNotification object:nil];
#pragma clang diagnostic pop
}

@end
#endif
